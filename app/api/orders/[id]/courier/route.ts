import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiResponse } from "@/lib/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCost, getOriginCityId, getActiveCouriers } from "@/lib/rajaongkir";
import {
  cancelPaymentTransaction,
  createPaymentTransaction,
  KomercePaymentError,
} from "@/lib/komerce-payment";
import { generateQris, getQrislySettings, QrislyError } from "@/lib/komerce-qrisly";
import { KOMERCE_PAYMENT_MIN_AMOUNT } from "@/lib/komerce-payment-constants";
import { QRISLY_MIN_AMOUNT } from "@/lib/komerce-qrisly-constants";

function toLocalPhone(phone: string): string {
  if (phone.startsWith("+62")) return "0" + phone.slice(3);
  if (phone.startsWith("62")) return "0" + phone.slice(2);
  return phone;
}

// PATCH /api/orders/[id]/courier — change courier for PENDING order, recalculates total + recreates payment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: true,
        payment: true,
      },
    });

    if (!order) return apiResponse.error("Order tidak ditemukan", 404);
    if (order.status !== "PENDING") return apiResponse.error("Hanya order PENDING yang bisa diubah", 400);
    if (order.payment?.status === "PAID") return apiResponse.error("Order sudah dibayar", 400);

    if (session?.user?.id && order.userId && order.userId !== session.user.id) {
      return apiResponse.error("Tidak diizinkan", 403);
    }

    const body = await request.json().catch(() => ({}));
    const { courier, service } = body as { courier: string; service: string };

    if (!courier?.trim() || !service?.trim()) {
      return apiResponse.error("Pilih kurir dan layanan pengiriman", 400);
    }

    // Validate courier via RajaOngkir
    const addr = (order.shippingAddress ?? {}) as Record<string, unknown>;
    const locationId = typeof addr.locationId === "string" ? addr.locationId : null;

    let newShippingCost = 0;
    if (locationId) {
      const origin = await getOriginCityId();
      if (origin) {
        const productIds = order.items.map((i) => i.productId);
        const products = await db.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, weight: true },
        });
        const productWeightMap = Object.fromEntries(products.map((p) => [p.id, p.weight]));

        const totalWeight = order.items.reduce((sum, item) => {
          return sum + (productWeightMap[item.productId] ?? 0) * item.quantity;
        }, 0);

        const activeCouriers = await getActiveCouriers();
        const result = await getCost(origin, locationId, Math.max(totalWeight, 250), activeCouriers);
        const match = result.costs
          .flatMap((c) => c.services.map((s) => ({ courier: c.courier, service: s.service, cost: s.cost })))
          .find((o) => o.courier.toLowerCase() === courier.toLowerCase() && o.service.toLowerCase() === service.toLowerCase());

        if (!match) {
          return apiResponse.error("Layanan pengiriman tidak valid atau tidak tersedia untuk tujuan ini", 400);
        }
        newShippingCost = Math.round(match.cost);
      }
    }

    const newTotal = order.subtotal - order.discount + newShippingCost;

    // Cancel old payment (non-fatal)
    if (order.payment?.paymentToken && order.payment?.method !== "QRIS") {
      try {
        await cancelPaymentTransaction(order.payment.paymentToken, "Ganti metode pengiriman");
      } catch { /* non-fatal */ }
    }

    // Update order
    await db.order.update({
      where: { id: order.id },
      data: {
        courier,
        courierService: service,
        shippingCost: newShippingCost,
        total: newTotal,
      },
    });

    if (order.payment) {
      await db.payment.update({
        where: { id: order.payment.id },
        data: { amount: newTotal },
      });
    }

    // Recreate payment with new amount
    const currentPayment = order.payment;
    const paymentMethod = (currentPayment?.method ?? "VA") as "VA" | "QRIS";

    let newPaymentData: {
      paymentUrl: string | null;
      vaNumber: string | null;
      vaBank: string | null;
      expiresAt: string | null;
      finalAmount: number | null;
    } = { paymentUrl: null, vaNumber: null, vaBank: null, expiresAt: null, finalAmount: null };

    if (currentPayment && newTotal >= KOMERCE_PAYMENT_MIN_AMOUNT) {
      try {
        const isQris = paymentMethod === "QRIS";
        const qrislyCfg = await getQrislySettings();
        const useQrisly = isQris && Boolean(qrislyCfg.apiKey && qrislyCfg.qrisId);

        // Get customer info
        let customerName = order.guestName ?? "Customer";
        let customerEmail = order.guestEmail ?? "";
        let customerPhone = order.guestPhone ?? "";
        if (order.userId) {
          const [profile, user] = await Promise.all([
            db.profile.findUnique({ where: { userId: order.userId } }),
            db.user.findUnique({ where: { id: order.userId } }),
          ]);
          if (profile) customerName = `${profile.firstName} ${profile.lastName}`.trim();
          if (user) customerEmail = user.email;
          if (profile?.phone) customerPhone = profile.phone;
        }
        customerPhone = toLocalPhone(customerPhone);

        if (useQrisly) {
          if (newTotal >= QRISLY_MIN_AMOUNT) {
            const qris = await generateQris({ qrisId: qrislyCfg.qrisId, amount: newTotal });
            const origin = process.env.NEXT_PUBLIC_APP_URL ?? "";
            const paymentUrl = origin && qris.qrisString
              ? `${origin}/api/payments/qr?data=${encodeURIComponent(qris.qrisString)}`
              : null;
            await db.payment.update({
              where: { id: currentPayment.id },
              data: {
                status: "PENDING", paymentToken: qris.historyId, paymentUrl,
                vaNumber: null, paidAt: null, transactionId: null,
                payload: { provider: "qrisly", historyId: qris.historyId, qrisString: qris.qrisString,
                  originalAmount: qris.originalAmount, finalAmount: qris.finalAmount, expiryTime: qris.expiryTime, ...qris.raw },
              },
            });
            newPaymentData = { paymentUrl, vaNumber: null, vaBank: null, expiresAt: qris.expiryTime ?? null, finalAmount: qris.finalAmount ?? null };
          }
        } else {
          const prevPayload = (currentPayment.payload ?? {}) as Record<string, unknown>;
          const prevBank = typeof prevPayload.bank === "string" ? prevPayload.bank : null;
          const channelCode = isQris ? undefined : (prevBank ?? undefined);

          const paymentResult = await createPaymentTransaction({
            orderId: order.orderNumber,
            paymentType: isQris ? "qris" : "bank_transfer",
            channelCode,
            amount: newTotal,
            customer: { name: customerName, email: customerEmail, phone: customerPhone },
            items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
            callbackUrl: process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://")
              ? `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`
              : undefined,
          });

          let paymentUrl = paymentResult.paymentUrl;
          if (isQris && paymentResult.qrString) {
            const origin = process.env.NEXT_PUBLIC_APP_URL ?? "";
            paymentUrl = origin ? `${origin}/api/payments/qr?data=${encodeURIComponent(paymentResult.qrString)}` : paymentResult.paymentUrl;
          }

          await db.payment.update({
            where: { id: currentPayment.id },
            data: {
              amount: newTotal, status: "PENDING", paymentToken: paymentResult.paymentId,
              paymentUrl, vaNumber: paymentResult.vaNumber ?? null, paidAt: null, transactionId: null,
              payload: { ...paymentResult.raw, bank: channelCode ?? null, qrString: paymentResult.qrString ?? null,
                expiresAt: paymentResult.expiresAt, paymentType: isQris ? "qris" : "bank_transfer" },
            },
          });

          newPaymentData = {
            paymentUrl: paymentUrl ?? null,
            vaNumber: paymentResult.vaNumber ?? null,
            vaBank: channelCode ?? null,
            expiresAt: paymentResult.expiresAt ?? null,
            finalAmount: null,
          };
        }
      } catch (err) {
        if (err instanceof KomercePaymentError || err instanceof QrislyError) {
          console.warn("[PATCH /api/orders/:id/courier] payment recreate failed:", err.message);
          // Non-fatal: order updated, payment will show stale amount
        } else {
          throw err;
        }
      }
    }

    return apiResponse.success({
      courier,
      courierService: service,
      shippingCost: newShippingCost,
      total: newTotal,
      ...newPaymentData,
    }, "Metode pengiriman berhasil diperbarui");
  } catch (err) {
    console.error("[PATCH /api/orders/:id/courier]", err);
    return apiResponse.error(err instanceof Error ? err.message : "Gagal mengubah kurir", 500);
  }
}
