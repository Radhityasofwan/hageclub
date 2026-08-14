import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { success, error } from "@/lib/api-response";
import { orderDetail, getKomshipSettings, KomshipError } from "@/lib/komship";
import { loadOrderForDelivery } from "@/lib/delivery";

export const dynamic = "force-dynamic";

// GET /api/admin/delivery/detail?orderId= — detail order pengiriman dari Komship
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return error("Unauthorized", 401);
  }

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId") ?? "";
  if (!orderId) return error("orderId required", 400);

  const order = await loadOrderForDelivery(orderId);
  if (!order) return error("Order not found", 404);
  if (!order.deliveryOrderNo) {
    return error("Order belum dibuat di Komship.", 400);
  }

  const config = await getKomshipSettings();
  if (!config.apiKey) {
    return error("API key Komship belum dikonfigurasi.", 503);
  }

  try {
    const detail = await orderDetail(order.deliveryOrderNo);
    return success(detail);
  } catch (err) {
    if (err instanceof KomshipError) {
      return error(err.message, err.code === "NOT_CONFIGURED" ? 503 : 502);
    }
    console.error("[GET /api/admin/delivery/detail]", err);
    return error("Gagal mengambil detail pengiriman.", 500);
  }
}
