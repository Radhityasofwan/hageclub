import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { getPaymentTransactionStatus } from "@/lib/komerce-payment";
import { getQrislyPaymentStatus, mapQrislyOrderStatus, mapQrislyStatus } from "@/lib/komerce-qrisly";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const payment = await db.payment.findFirst({
      where: { orderId },
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          select: { id: true, orderNumber: true, status: true },
        },
      },
    });

    if (!payment) {
      return error("Payment not found", 404);
    }

    const payload = (payment.payload ?? {}) as Record<string, unknown>;
    const isQrisly = payload.provider === "qrisly";
    const expiresAt = (payload.expiresAt ?? payload.expiryTime ?? payload.expired_at ?? null) as string | null;

    // If still pending and has paymentToken, sync latest status from provider.
    // Transisi non-PENDING DIPERSIST ke DB — di dev callback_url tidak terkirim
    // (https check), jadi polling ini satu-satunya jalur status → order.
    let freshPaymentStatus: string | null = null;
    let freshOrderStatus: string | null = null;
    let freshPaidAt: string | null = null;
    if (payment.status === "PENDING" && payment.paymentToken) {
      try {
        if (isQrisly) {
          const latest = await getQrislyPaymentStatus(payment.paymentToken);
          const mapped = mapQrislyStatus(latest.status);
          if (mapped !== "PENDING") {
            const orderStatus = mapQrislyOrderStatus(latest.status);
            await persistTransition({
              paymentId: payment.id,
              orderId: payment.order.id,
              paymentStatus: mapped,
              orderStatus,
              paidAt: latest.paidAt ?? null,
              transactionId: payment.paymentToken,
              note: qrislyNote(latest.status),
            });
            freshPaymentStatus = mapped;
            freshOrderStatus = orderStatus;
            freshPaidAt = latest.paidAt ?? null;
          }
        } else {
          const latest = await getPaymentTransactionStatus(payment.paymentToken);
          const mapped = mapStatus(latest.status);
          if (mapped !== "PENDING") {
            const orderStatus = orderStatusFrom(mapped);
            await persistTransition({
              paymentId: payment.id,
              orderId: payment.order.id,
              paymentStatus: mapped,
              orderStatus,
              paidAt: latest.paidAt ?? null,
              transactionId: payment.paymentToken,
              note: komerceNote(mapped),
            });
            freshPaymentStatus = mapped;
            freshOrderStatus = orderStatus;
            freshPaidAt = latest.paidAt ?? null;
          }
        }
      } catch {
        // Provider API may not be configured — return cached status
      }
    }

    return success({
      id: payment.id,
      status: freshPaymentStatus ?? payment.status,
      method: payment.method,
      amount: payment.amount,
      vaNumber: payment.vaNumber,
      paymentUrl: payment.paymentUrl,
      paidAt: freshPaidAt ?? payment.paidAt?.toISOString() ?? null,
      expiresAt,
      orderStatus: freshOrderStatus ?? payment.order.status,
    });
  } catch (err) {
    console.error("[GET /api/payments/:orderId/status]", err);
    return error("Failed to fetch payment status", 500);
  }
}

// CANCELED (Komerce) → FAILED (enum PaymentStatus lokal)
function mapStatus(
  status: "PENDING" | "PAID" | "EXPIRED" | "CANCELED"
): "PENDING" | "PAID" | "FAILED" | "EXPIRED" {
  if (status === "CANCELED") return "FAILED";
  return status;
}

function orderStatusFrom(paymentStatus: string): "PENDING" | "PAID" | "CANCELLED" {
  if (paymentStatus === "PAID") return "PAID";
  if (paymentStatus === "EXPIRED" || paymentStatus === "FAILED") return "CANCELLED";
  return "PENDING";
}

function qrislyNote(status: string): string {
  if (status === "paid") return "Pembayaran QRIS diterima (QRIS)";
  if (status === "expired") return "QRIS kedaluwarsa (QRIS)";
  if (status === "cancelled") return "Pembayaran QRIS dibatalkan (QRIS)";
  return "Menunggu pembayaran QRIS (QRIS)";
}

function komerceNote(paymentStatus: string): string {
  if (paymentStatus === "PAID") return "Pembayaran diterima";
  if (paymentStatus === "EXPIRED") return "Pembayaran kedaluwarsa";
  if (paymentStatus === "FAILED") return "Pembayaran dibatalkan";
  return "Menunggu pembayaran";
}

interface TransitionParams {
  paymentId: string;
  orderId: string;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "EXPIRED";
  orderStatus: "PENDING" | "PAID" | "CANCELLED";
  paidAt: string | null;
  transactionId: string;
  note: string;
}

/**
 * Persist transisi status — idempotent via updateMany dengan kondisi
 * status PENDING: jika request lain sudah lebih dulu mempersist, count = 0
 * dan order/status history tidak ditulis ulang.
 */
async function persistTransition(params: TransitionParams) {
  await db.$transaction(async (tx) => {
    const updated = await tx.payment.updateMany({
      where: { id: params.paymentId, status: "PENDING" },
      data: {
        status: params.paymentStatus,
        paidAt:
          params.paymentStatus === "PAID"
            ? params.paidAt
              ? new Date(params.paidAt)
              : new Date()
            : null,
        transactionId: params.transactionId,
      },
    });
    if (updated.count === 0) return;

    await tx.order.update({
      where: { id: params.orderId },
      data: { status: params.orderStatus },
    });
    await tx.orderStatusHistory.create({
      data: {
        orderId: params.orderId,
        status: params.orderStatus,
        note: params.note,
        createdBy: "system",
      },
    });
  });
}
