import { NextRequest } from "next/server";
import { apiResponse } from "@/lib/api-response";
import { getOrderById } from "@/lib/queries/order";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    const order = await getOrderById(id);
    if (!order) {
      return apiResponse.error("Order not found", 404);
    }

    // Guest access: order can be accessed by anyone (used by success page)
    // Authenticated user: only their own orders
    if (session?.user?.id && order.userId && order.userId !== session.user.id) {
      return apiResponse.error("Not authorized", 403);
    }

    return apiResponse.success(order);
  } catch (err) {
    console.error("[GET /api/orders/:id]", err);
    return apiResponse.error("Failed to fetch order", 500);
  }
}
