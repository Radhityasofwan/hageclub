import { NextRequest } from "next/server";
import { apiResponse } from "@/lib/api-response";
import { db } from "@/lib/db";
import { historyAWB } from "@/lib/komship";
import { komshipCourierName } from "@/lib/komship-constants";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Look up by either UUID or orderNumber
    const isUuid = id.includes("-");
    const where = isUuid
      ? { id }
      : { orderNumber: id.toUpperCase() };

    const order = await db.order.findUnique({
      where,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        courier: true,
        courierService: true,
        trackingNumber: true,
        subtotal: true,
        discount: true,
        shippingCost: true,
        total: true,
        createdAt: true,
        shippingAddress: true,
        items: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            quantity: true,
            subtotal: true,
            imageUrl: true,
          },
        },
        statusHistory: {
          select: { status: true, note: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        },
        payment: {
          select: { status: true, method: true, amount: true },
        },
        coupon: {
          select: { code: true },
        },
      },
    });

    if (!order) {
      return apiResponse.error("Order not found", 404);
    }

    let trackingHistory: Array<{ datetime: string; description: string; location?: string }> = [];

    if (order.trackingNumber && order.courier) {
      try {
        const courier = komshipCourierName(order.courier) ?? order.courier.toUpperCase();
        const tracking = await historyAWB(courier, order.trackingNumber);
        trackingHistory = (tracking.history ?? []).map((h) => ({
          datetime: h.date,
          description: h.desc || h.status || "",
          location: h.code || undefined,
        }));
      } catch {
        // Tracking API may fail silently
      }
    }

    return apiResponse.success({
      ...order,
      coupon: undefined,
      couponCode: order.coupon?.code ?? null,
      trackingHistory,
    });
  } catch (err) {
    console.error("[GET /api/orders/:id/status]", err);
    return apiResponse.error("Failed to fetch order status", 500);
  }
}
