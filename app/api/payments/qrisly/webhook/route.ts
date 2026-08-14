import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { mapQrislyOrderStatus, mapQrislyStatus } from "@/lib/komerce-qrisly";
import { sendEmail } from "@/lib/email";
import {
  paymentConfirmedEmail,
  renderEmail,
} from "@/lib/email-templates";

// Webhook endpoint dikecualikan dari auth middleware (lihat middleware.ts)
// QRISLY mengirim notifikasi saat ada perubahan status pembayaran
// (dokumen API-Qrisly.md §5): event payment.success / payment.expired,
// payload { event, timestamp, data: { qris_history_id, status, amount, ... } }.
// Harus balas 200 {"success":true,...} — selain itu QRISLY retry 3x
// (1 mnt, 5 mnt, 15 mnt).

export async function POST(request: NextRequest) {
  try {
    // 1. Parse payload — event wrapper { event, timestamp, data }
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return jsonOk();
    }

    const data = (body.data ?? body) as Record<string, unknown>;
    const qrisHistoryId = String(data.qris_history_id ?? data.history_id ?? "");
    const qrisId = String(data.qris_id ?? data.qrisId ?? "");
    const event = String(body.event ?? "");
    // Doc §2 contoh payload flat (tanpa wrapper event): { qris_history_id,
    // payment_status, ... } — jadikan data.payment_status sumber status juga.
    const status = String(
      data.status ??
        data.payment_status ??
        (event === "payment.success"
          ? "paid"
          : event === "payment.expired"
            ? "expired"
            : "")
    ).toLowerCase();
    const paidAt = (data.paid_at ?? null) as string | null;
    const paymentMethod = (data.payment_method ?? null) as string | null;
    const paymentProvider = (data.payment_provider ?? null) as string | null;

    if (!qrisHistoryId) {
      console.warn("[WEBHOOK QRISLY] Payload tanpa qris_history_id — diabaikan.");
      return jsonOk();
    }

    // 2. Cari payment record by paymentToken (= qris_history_id saat create)
    const payment = await db.payment.findFirst({
      where: { paymentToken: qrisHistoryId },
      orderBy: { createdAt: "desc" },
      include: { order: { include: { items: true } } },
    });

    if (!payment) {
      console.warn(`[WEBHOOK QRISLY] Payment tidak ditemukan untuk history_id ${qrisHistoryId} (qris_id: ${qrisId || "-"}).`);
      return jsonOk(); // Selalu 200 agar tidak retry
    }

    const order = payment.order;

    // 3. Mapping status QRISLY → enum lokal
    const mappedPaymentStatus = mapQrislyStatus(status);
    const mappedOrderStatus = mapQrislyOrderStatus(status);

    // 4. Idempotent — skip jika status sudah sama
    if (payment.status === mappedPaymentStatus) {
      return new Response(JSON.stringify({ success: true, message: "Webhook received and processed (duplicate)" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5. Update dalam transaction
    await db.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: mappedPaymentStatus,
          paidAt:
            mappedPaymentStatus === "PAID"
              ? paidAt ? new Date(paidAt) : new Date()
              : null,
          transactionId: qrisHistoryId,
          payload: body as Prisma.InputJsonValue,
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
          note: getStatusNote(status, paymentMethod, paymentProvider),
          createdBy: "system",
        },
      });

      // Kedaluwarsa / dibatalkan — restore stok (variant bila ada, fallback product)
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

    // 6. Email konfirmasi jika PAID
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
          console.error("[WEBHOOK QRISLY] Gagal kirim email konfirmasi:", err);
        }
      }
    }

    return jsonOk();
  } catch (err) {
    console.error("[POST /api/payments/qrisly/webhook]", err);
    // Selalu 200 agar QRISLY tidak retry pada kesalahan internal
    return jsonOk();
  }
}

function jsonOk() {
  return new Response(
    JSON.stringify({ success: true, message: "Webhook received and processed" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

function getStatusNote(
  status: string,
  paymentMethod: string | null,
  paymentProvider: string | null
): string {
  const via = [paymentProvider, paymentMethod].filter(Boolean).join(" / ");
  const suffix = via ? ` (${via})` : " (QRIS)";
  if (status === "paid") return `Pembayaran QRIS diterima${suffix}`;
  if (status === "expired") return `QRIS kedaluwarsa${suffix}`;
  if (status === "cancelled") return `Pembayaran QRIS dibatalkan${suffix}`;
  return `Menunggu pembayaran QRIS${suffix}`;
}
