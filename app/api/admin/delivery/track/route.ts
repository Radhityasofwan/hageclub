import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { success, error } from "@/lib/api-response";
import { db } from "@/lib/db";
import { historyAWB, getKomshipSettings, KomshipError } from "@/lib/komship";
import { komshipCourierName } from "@/lib/komship-constants";
import { loadOrderForDelivery } from "@/lib/delivery";

export const dynamic = "force-dynamic";

// GET /api/admin/delivery/track?orderId= — riwayat tracking AWB
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

  if (!order.trackingNumber) {
    return error("Order belum memiliki nomor resi (AWB).", 400);
  }

  const config = await getKomshipSettings();
  if (!config.apiKey) {
    return error("API key Komship belum dikonfigurasi.", 503);
  }

  const courier = order.courier
    ? (komshipCourierName(order.courier) ?? order.courier.toUpperCase())
    : "";

  try {
    const history = await historyAWB(courier, order.trackingNumber);

    if (history.lastStatus && history.lastStatus !== order.deliveryStatus) {
      await db.order.update({
        where: { id: order.id },
        data: { deliveryStatus: history.lastStatus },
      });
    }

    return success({ ...history, courier });
  } catch (err) {
    if (err instanceof KomshipError) {
      return error(err.message, err.code === "NOT_CONFIGURED" ? 503 : 502);
    }
    console.error("[GET /api/admin/delivery/track]", err);
    return error("Gagal mengambil riwayat pengiriman.", 500);
  }
}
