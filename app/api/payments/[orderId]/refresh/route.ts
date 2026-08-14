import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { getSettingValue } from "@/lib/settings";
import {
  createPaymentTransaction,
  getPaymentMethods,
  KomercePaymentError,
} from "@/lib/komerce-payment";
import {
  KOMERCE_PAYMENT_MIN_AMOUNT,
} from "@/lib/komerce-payment-constants";
import {
  generateQris,
  getQrislySettings,
  QrislyError,
} from "@/lib/komerce-qrisly";
import { QRISLY_MIN_AMOUNT } from "@/lib/komerce-qrisly-constants";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    // Cari order
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true, payment: true },
    });

    if (!order) {
      return error("Order not found", 404);
    }

    if (order.status !== "PENDING") {
      return error("Only PENDING orders can refresh payment", 400);
    }

    const currentPayment = order.payment;
    if (currentPayment?.status === "PAID") {
      return error("Order is already paid", 400);
    }
    // Payment dianggap masih aktif bila PENDING dan masa berlaku server-side belum lewat.
    // Status DB bisa saja masih PENDING padahal sudah kedaluwarsa di penyedia — cek dari payload.
    const curPayload = (currentPayment?.payload ?? {}) as Record<string, unknown>;
    const rawExpiry =
      (typeof curPayload.expiresAt === "string" && curPayload.expiresAt ? curPayload.expiresAt : null) ??
      (typeof curPayload.expiryTime === "string" && curPayload.expiryTime ? curPayload.expiryTime : null) ??
      (typeof curPayload.expired_at === "string" && curPayload.expired_at ? curPayload.expired_at : null);
    const expiryMs = rawExpiry ? new Date(rawExpiry).getTime() : NaN;
    const serverExpired = !Number.isNaN(expiryMs) && expiryMs <= Date.now();
    if (currentPayment && currentPayment.status === "PENDING" && !serverExpired) {
      return error("Payment is still active — no need to refresh", 400);
    }

    // Determine payment method from existing payment
    const paymentMethod = (currentPayment?.method ?? "VA") as "VA" | "QRIS" | "EWALLET";
    if (paymentMethod === "EWALLET") {
      return error("E-Wallet belum tersedia — pilih Virtual Account atau QRIS.", 400);
    }

    const isQris = paymentMethod === "QRIS";
    const qrislyCfg = await getQrislySettings();
    const useQrisly =
      isQris && Boolean(qrislyCfg.apiKey && qrislyCfg.qrisId);

    // ── QRISLY: QRIS dinamis dari QRIS statis ──
    if (useQrisly) {
      if (order.total < QRISLY_MIN_AMOUNT) {
        return error(`Total minimal pembayaran ${QRISLY_MIN_AMOUNT.toLocaleString("id-ID")} IDR.`, 400);
      }

      const qris = await generateQris({
        qrisId: qrislyCfg.qrisId,
        amount: order.total,
      });

      const origin = process.env.NEXT_PUBLIC_APP_URL ?? "";
      const paymentUrl =
        origin && qris.qrisString
          ? `${origin}/api/payments/qr?data=${encodeURIComponent(qris.qrisString)}`
          : null;

      const newPayment = await db.payment.update({
        where: { id: currentPayment!.id },
        data: {
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
        id: newPayment.id,
        paymentMethod,
        paymentUrl: paymentUrl ?? null,
        vaNumber: null,
        bank: null,
        qrisUrl: paymentUrl,
        expiresAt: qris.expiryTime ?? null,
      });
    }

    // ── Komerce Payment API: VA / QRIS ──
    if (order.total < KOMERCE_PAYMENT_MIN_AMOUNT) {
      return error(`Total minimal pembayaran ${KOMERCE_PAYMENT_MIN_AMOUNT.toLocaleString("id-ID")} IDR.`, 400);
    }

    // Channel bank VA: pakai bank dari transaksi sebelumnya bila ada, lalu bank
    // pertama dari API /methods (source of truth per dokumen), terakhir setting lama
    const prevPayload = (currentPayment?.payload ?? {}) as Record<string, unknown>;
    const prevBank = typeof prevPayload.bank === "string" ? prevPayload.bank : null;
    let channelCode: string | undefined;
    if (!isQris) {
      channelCode = prevBank ?? undefined;
      if (!channelCode) {
        try {
          const methods = await getPaymentMethods();
          channelCode = methods.find((m) => m.paymentType === "va")?.bankCode ?? undefined;
        } catch {
          // lanjut ke fallback setting
        }
      }
      if (!channelCode) {
        const banks = (await getSettingValue("payment_va_banks")) ?? "";
        channelCode = banks.split(",").map((b) => b.trim()).find(Boolean) ?? "BCA";
      }
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
      if (profile?.phone) customerPhone = profile.phone;
    }

    // Normalize phone to local format (Komerce requires numeric only)
    if (customerPhone.startsWith("+62")) customerPhone = "0" + customerPhone.slice(3);
    else if (customerPhone.startsWith("62")) customerPhone = "0" + customerPhone.slice(2);

    // Create payment via Komerce Payment API
    const paymentResult = await createPaymentTransaction({
      orderId: order.orderNumber,
      paymentType: isQris ? "qris" : "bank_transfer",
      channelCode,
      amount: order.total,
      customer: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
      },
      items: order.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      })),
      callbackUrl: process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://")
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`
        : undefined,
    });

    // QRIS: paymentUrl diarahkan ke render QR server (qr_string)
    let paymentUrl = paymentResult.paymentUrl;
    let bank: string | null = prevBank;
    if (isQris && paymentResult.qrString) {
      const origin = process.env.NEXT_PUBLIC_APP_URL ?? "";
      paymentUrl = origin
        ? `${origin}/api/payments/qr?data=${encodeURIComponent(paymentResult.qrString)}`
        : paymentResult.paymentUrl;
    } else if (!isQris && paymentResult.vaNumber) {
      bank = channelCode ?? null;
    }

    // Update payment record in place (satu record per order — Payment.orderId unique)
    const newPayment = await db.payment.update({
      where: { id: currentPayment!.id },
      data: {
        method: paymentMethod,
        status: "PENDING",
        paymentToken: paymentResult.paymentId,
        paymentUrl,
        vaNumber: paymentResult.vaNumber,
        paidAt: null,
        transactionId: null,
        payload: {
          ...paymentResult.raw,
          bank,
          qrString: paymentResult.qrString ?? null,
          expiresAt: paymentResult.expiresAt,
          paymentType: isQris ? "qris" : "bank_transfer",
        },
      },
    });

    return success({
      id: newPayment.id,
      paymentMethod,
      paymentUrl: paymentUrl ?? null,
      vaNumber: paymentResult.vaNumber ?? null,
      bank,
      qrisUrl: isQris ? paymentUrl : null,
      expiresAt: paymentResult.expiresAt ?? null,
    });
  } catch (err) {
    if (err instanceof KomercePaymentError || err instanceof QrislyError) {
      console.warn("[POST /api/payments/:orderId/refresh]", err.message);
      return error(err.message, err.code === "NOT_CONFIGURED" ? 503 : 502);
    }
    console.error("[POST /api/payments/:orderId/refresh]", err);
    return error(
      err instanceof Error ? err.message : "Failed to refresh payment",
      500
    );
  }
}
