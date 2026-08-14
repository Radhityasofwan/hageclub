import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiResponse } from "@/lib/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  cancelPaymentTransaction,
  KomercePaymentError,
} from "@/lib/komerce-payment";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    const order = await db.order.findUnique({
      where: { id },
      include: { items: true, payment: true },
    });

    if (!order) return apiResponse.error("Order tidak ditemukan", 404);
    if (order.status !== "PENDING") {
      return apiResponse.error("Hanya order dengan status Menunggu yang bisa dibatalkan", 400);
    }
    if (order.payment?.status === "PAID") {
      return apiResponse.error("Order sudah dibayar dan tidak bisa dibatalkan", 400);
    }

    // Auth: authenticated users can only cancel their own orders;
    // guest orders (no userId) are accessible by orderId knowledge
    if (session?.user?.id && order.userId && order.userId !== session.user.id) {
      return apiResponse.error("Tidak diizinkan", 403);
    }

    // Cancel Komerce payment transaction if still active
    if (order.payment?.paymentToken) {
      try {
        await cancelPaymentTransaction(
          order.payment.paymentToken,
          "Dibatalkan oleh customer"
        );
      } catch (err) {
        // Upstream cancel failures are non-fatal (QRIS can't be cancelled, expired VA already gone)
        if (!(err instanceof KomercePaymentError)) {
          console.warn("[POST /api/orders/:id/cancel] payment cancel warning:", err);
        }
      }
    }

    // Restore stock + cancel order in one transaction
    await db.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      });

      if (order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: { status: "FAILED" },
        });
      }

      await tx.orderStatusHistory.create({
        data: { orderId: order.id, status: "CANCELLED", note: "Dibatalkan oleh customer" },
      });

      const variantProductIds = new Set<string>();
      for (const item of order.items) {
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
    });

    return apiResponse.success({ cancelled: true }, "Order berhasil dibatalkan");
  } catch (err) {
    console.error("[POST /api/orders/:id/cancel]", err);
    return apiResponse.error(
      err instanceof Error ? err.message : "Gagal membatalkan order",
      500
    );
  }
}
