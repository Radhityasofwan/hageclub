import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import {
  cancelPaymentTransaction,
  createPaymentTransaction,
  KomercePaymentError,
} from "@/lib/komerce-payment";
import {
  generateQris,
  getQrislySettings,
  QrislyError,
} from "@/lib/komerce-qrisly";
import { KOMERCE_PAYMENT_MIN_AMOUNT } from "@/lib/komerce-payment-constants";
import { QRISLY_MIN_AMOUNT } from "@/lib/komerce-qrisly-constants";

// POST /api/payments/[orderId]/method — change payment method for an existing PENDING order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await request.json().catch(() => ({}));
    const method = (body.method as string)?.toUpperCase();
    const bankCode = (body.bankCode as string) || undefined;

    if (!method || !["VA", "QRIS"].includes(method)) {
      return error("Metode pembayaran tidak valid. Pilih VA atau QRIS.", 400);
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true, payment: true },
    });

    if (!order) return error("Order tidak ditemukan", 404);
    if (order.status !== "PENDING") return error("Order tidak dalam status PENDING", 400);
    if (order.payment?.status === "PAID") return error("Order sudah dibayar", 400);

    const currentPayment = order.payment;

    // Cancel existing VA Komerce transaction (QRIS can't be cancelled via API)
    if (
      currentPayment?.paymentToken &&
      currentPayment?.method !== "QRIS"
    ) {
      try {
        await cancelPaymentTransaction(currentPayment.paymentToken, "Ganti metode pembayaran");
      } catch {
        // Non-fatal — might already be expired
      }
    }

    const isQris = method === "QRIS";
    const qrislyCfg = await getQrislySettings();
    const useQrisly = isQris && Boolean(qrislyCfg.apiKey && qrislyCfg.qrisId);

    if (useQrisly) {
      if (order.total < QRISLY_MIN_AMOUNT) {
        return error(`Total minimal pembayaran ${QRISLY_MIN_AMOUNT.toLocaleString("id-ID")} IDR.`, 400);
      }
      const qris = await generateQris({ qrisId: qrislyCfg.qrisId, amount: order.total });
      const origin = process.env.NEXT_PUBLIC_APP_URL ?? "";
      const paymentUrl = origin && qris.qrisString
        ? `${origin}/api/payments/qr?data=${encodeURIComponent(qris.qrisString)}`
        : null;

      await db.payment.update({
        where: { id: currentPayment!.id },
        data: {
          method: "QRIS",
          status: "PENDING",
          paymentToken: qris.historyId,
          paymentUrl: paymentUrl ?? null,
          vaNumber: null,
          paidAt: null,
          transactionId: null,
          payload: {
            provider: "qrisly",
            historyId: qris.historyId,
            qrisString: qris.qrisString,
            originalAmount: qris.originalAmount,
            finalAmount: qris.finalAmount,
            expiryTime: qris.expiryTime,
            ...qris.raw,
          },
        },
      });

      return success({
        method: "QRIS",
        paymentUrl: paymentUrl ?? null,
        vaNumber: null,
        vaBank: null,
        expiresAt: qris.expiryTime ?? null,
        finalAmount: qris.finalAmount ?? null,
      });
    }

    // Komerce Payment
    if (order.total < KOMERCE_PAYMENT_MIN_AMOUNT) {
      return error(`Total minimal pembayaran ${KOMERCE_PAYMENT_MIN_AMOUNT.toLocaleString("id-ID")} IDR.`, 400);
    }

    const channelCode = isQris ? undefined : bankCode;
    if (!isQris && !channelCode) {
      return error("Pilih bank untuk Virtual Account.", 400);
    }

    // Get customer info from order (userId order → fetch profile, guest → from guestName/Email/Phone)
    let customerName = order.guestName ?? "Customer";
    let customerEmail = order.guestEmail ?? "";
    let customerPhone = order.guestPhone ?? "";

    if (order.userId) {
      const profile = await db.profile.findUnique({ where: { userId: order.userId } });
      const user = await db.user.findUnique({ where: { id: order.userId } });
      if (profile) customerName = `${profile.firstName} ${profile.lastName}`.trim();
      if (user) customerEmail = user.email;
      // phone from profile
      if (profile?.phone) customerPhone = profile.phone;
    }

    // Normalize phone to local format (Komerce requires numeric only)
    if (customerPhone.startsWith("+62")) customerPhone = "0" + customerPhone.slice(3);
    else if (customerPhone.startsWith("62")) customerPhone = "0" + customerPhone.slice(2);

    const paymentResult = await createPaymentTransaction({
      orderId: order.orderNumber,
      paymentType: isQris ? "qris" : "bank_transfer",
      channelCode,
      amount: order.total,
      customer: { name: customerName, email: customerEmail, phone: customerPhone },
      items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
      callbackUrl: process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://")
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`
        : undefined,
    });

    let paymentUrl = paymentResult.paymentUrl;
    if (isQris && paymentResult.qrString) {
      const origin = process.env.NEXT_PUBLIC_APP_URL ?? "";
      paymentUrl = origin
        ? `${origin}/api/payments/qr?data=${encodeURIComponent(paymentResult.qrString)}`
        : paymentResult.paymentUrl;
    }

    await db.payment.update({
      where: { id: currentPayment!.id },
      data: {
        method: method as "VA" | "QRIS",
        status: "PENDING",
        paymentToken: paymentResult.paymentId,
        paymentUrl,
        vaNumber: paymentResult.vaNumber ?? null,
        paidAt: null,
        transactionId: null,
        payload: {
          ...paymentResult.raw,
          bank: channelCode ?? null,
          qrString: paymentResult.qrString ?? null,
          expiresAt: paymentResult.expiresAt,
          paymentType: isQris ? "qris" : "bank_transfer",
        },
      },
    });

    return success({
      method,
      paymentUrl: paymentUrl ?? null,
      vaNumber: paymentResult.vaNumber ?? null,
      vaBank: channelCode ?? null,
      expiresAt: paymentResult.expiresAt ?? null,
      finalAmount: null,
    });
  } catch (err) {
    if (err instanceof KomercePaymentError || err instanceof QrislyError) {
      console.warn("[POST /api/payments/:orderId/method]", err.message);
      return error(err.message, err.code === "NOT_CONFIGURED" ? 503 : 502);
    }
    console.error("[POST /api/payments/:orderId/method]", err);
    return error(err instanceof Error ? err.message : "Gagal mengubah metode pembayaran", 500);
  }
}
