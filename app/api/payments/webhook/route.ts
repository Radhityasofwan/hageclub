import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  verifyPaymentCallback,
  getKomercePaymentSettings,
} from "@/lib/komerce-payment";
import { sendEmail } from "@/lib/email";
import {
  paymentConfirmedEmail,
  renderEmail,
} from "@/lib/email-templates";

// Webhook endpoint dikecualikan dari auth middleware (lihat middleware.ts)
// Komerce Payment akan mengirim POST ke endpoint ini untuk notifikasi status
// pembayaran (PENDING, PAID, EXPIRED, CANCELED).
// Verifikasi: header "X-Callback-Api-Key" berisi HMAC-SHA256(raw body) dengan
// secret = callback_api_key milik kita (dokumen API-payment-service.md §6).

export async function POST(request: NextRequest) {
  try {
    // 1. Baca raw body (WAJIB persis seperti terkirim — tanpa modifikasi)
    const rawBody = await request.text();
    const signature = request.headers.get("x-callback-api-key") ?? "";

    // 2. Verifikasi signature — mismatch → 401 (sesuai dokumen)
    const config = await getKomercePaymentSettings();
    if (config.callbackApiKey) {
      const valid = await verifyPaymentCallback(rawBody, signature);
      if (!valid) {
        console.warn("[WEBHOOK PAYMENT] Signature tidak valid — ditolak.");
        return new Response("Invalid signature", { status: 401 });
      }
    } else {
      // Callback API key belum dikonfigurasi — proses dengan peringatan
      // (tanpa key, callback_url tidak dikirim ke Komerce, jadi seharusnya
      // tidak ada callback masuk sama sekali)
      console.warn("[WEBHOOK PAYMENT] Callback API key belum dikonfigurasi — proses tanpa verifikasi.");
    }

    // 3. Parse payload (field defensif — dokumen tidak mencontohkan payload)
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const paymentId = (payload.payment_id ?? payload.id ?? "") as string;
    const externalId = (payload.order_id ?? payload.orderNumber ?? "") as string;
    const status = ((payload.status ?? payload.payment_status ?? "") as string).toUpperCase();
    const paidAt = (payload.paid_at ?? payload.payment_time ?? null) as string | null;
    const method = (payload.payment_method ?? payload.payment_type ?? null) as string | null;

    // 4. Cari order — by order_id (orderNumber) dulu, fallback by paymentToken
    let order = externalId
      ? await db.order.findUnique({ where: { orderNumber: externalId } })
      : null;

    if (!order && paymentId) {
      const payment = await db.payment.findFirst({
        where: { paymentToken: paymentId },
        select: { orderId: true },
      });
      if (payment) {
        order = await db.order.findUnique({ where: { id: payment.orderId } });
      }
    }

    if (!order) {
      console.warn(`[WEBHOOK PAYMENT] Order tidak ditemukan — payment_id: ${paymentId || "-"}, order_id: ${externalId || "-"}`);
      return new Response("OK", { status: 200 }); // Selalu 200 agar tidak retry
    }

    // 5. Cari payment record terbaru
    const payment = await db.payment.findFirst({
      where: { orderId: order.id },
      orderBy: { createdAt: "desc" },
      include: { order: { include: { items: true } } },
    });

    if (!payment) {
      console.warn(`[WEBHOOK PAYMENT] Payment tidak ditemukan untuk order ${order.orderNumber}`);
      return new Response("OK", { status: 200 });
    }

    // 6. Mapping status Komerce → enum lokal
    const mappedPaymentStatus = mapPaymentStatus(status);
    const mappedOrderStatus = mapOrderStatus(status);

    // 7. Idempotent — skip jika status sudah sama
    if (payment.status === mappedPaymentStatus) {
      return new Response("OK (duplicate)", { status: 200 });
    }

    // 8. Update dalam transaction
    await db.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: mappedPaymentStatus,
          paidAt:
            mappedPaymentStatus === "PAID"
              ? paidAt ? new Date(paidAt) : new Date()
              : null,
          transactionId: paymentId || undefined,
          payload: JSON.parse(rawBody) as Prisma.InputJsonValue,
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { status: mappedOrderStatus },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: mappedOrderStatus,
          note: getStatusNote(status, method ?? undefined),
          createdBy: "system",
        },
      });

      // Batalkan/kedaluwarsa — restore stok (variant bila ada, fallback product)
      // Setelah restore variant, sync product.stock parent agar konsisten dengan alur cancel lainnya.
      if (mappedOrderStatus === "CANCELLED") {
        const orderItems = await tx.orderItem.findMany({ where: { orderId: order.id } });
        const variantProductIds = new Set<string>();
        for (const item of orderItems) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
            variantProductIds.add(item.productId);
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
        // Sync product.stock parent untuk setiap produk yang punya variant (aggregate dari variant aktif)
        for (const productId of Array.from(variantProductIds)) {
          const agg = await tx.productVariant.aggregate({
            where: { productId, isActive: true },
            _sum: { stock: true },
          });
          await tx.product.update({
            where: { id: productId },
            data: { stock: agg._sum.stock ?? 0 },
          });
        }
      }

      // Coupon usage sudah dicatat saat order dibuat (app/api/orders/route.ts).
      // Jangan increment lagi di sini — akan menyebabkan double-count usedCount.
    });

    // 9. Email konfirmasi jika PAID
    if (mappedPaymentStatus === "PAID") {
      let customerEmail = order.guestEmail ?? null;
      let customerName = order.guestName ?? "Customer";

      if (!customerEmail && order.userId) {
        const user = await db.user.findUnique({
          where: { id: order.userId },
          select: { email: true, profile: { select: { firstName: true, lastName: true } } },
        });
        if (user) {
          customerEmail = user.email;
          if (user.profile) {
            customerName = `${user.profile.firstName} ${user.profile.lastName}`.trim();
          }
        }
      }

      if (customerEmail) {
        try {
          const template = paymentConfirmedEmail({
            orderNumber: order.orderNumber,
            customerName,
            total: payment.amount,
          });
          const rendered = renderEmail(template);
          await sendEmail(
            customerEmail,
            `Payment Confirmed — ${order.orderNumber}`,
            rendered.html,
            rendered.text
          );
        } catch (err) {
          console.error("[WEBHOOK PAYMENT] Gagal kirim email konfirmasi:", err);
        }
      }
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("[POST /api/payments/webhook]", err);
    // Selalu 200 agar Komerce tidak retry pada kesalahan internal
    return new Response("OK", { status: 200 });
  }
}

// =============================================================================
// STATUS MAPPERS — Komerce: PENDING | PAID | EXPIRED | CANCELED
// =============================================================================

function mapPaymentStatus(status: string): "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "REFUNDED" {
  if (status === "PAID") return "PAID";
  if (status === "EXPIRED") return "EXPIRED";
  if (status === "CANCELED" || status === "CANCELLED") return "FAILED";
  return "PENDING";
}

function mapOrderStatus(status: string): "PENDING" | "PAID" | "PROCESSING" | "CANCELLED" | "REFUNDED" {
  if (status === "PAID") return "PAID";
  if (status === "EXPIRED" || status === "CANCELED" || status === "CANCELLED") return "CANCELLED";
  return "PENDING";
}

function getStatusNote(status: string, method?: string): string {
  const m = method ? ` (${method})` : "";
  if (status === "PAID") return `Pembayaran diterima${m}`;
  if (status === "EXPIRED") return `Pembayaran kedaluwarsa${m}`;
  if (status === "CANCELED" || status === "CANCELLED") return `Pembayaran dibatalkan${m}`;
  return `Menunggu pembayaran${m}`;
}
