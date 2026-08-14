import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { success, error } from "@/lib/api-response";
import { db } from "@/lib/db";
import { cancelOrder, getKomshipSettings, KomshipError } from "@/lib/komship";
import { loadOrderForDelivery } from "@/lib/delivery";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({ orderId: z.string().min(1) });

// POST /api/admin/delivery/cancel — batalkan order pengiriman di Komship
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return error("Unauthorized", 401);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return error("Invalid payload", 400, parsed.error.flatten().fieldErrors);
  }

  const order = await loadOrderForDelivery(parsed.data.orderId);
  if (!order) return error("Order not found", 404);
  if (!order.deliveryOrderNo) {
    return error("Order belum dibuat di Komship.", 400);
  }

  const config = await getKomshipSettings();
  if (!config.apiKey) {
    return error("API key Komship belum dikonfigurasi.", 503);
  }

  try {
    await cancelOrder(order.deliveryOrderNo);

    await db.order.update({
      where: { id: order.id },
      data: { deliveryStatus: "Dibatalkan" },
    });

    return success(null, "Order pengiriman dibatalkan.");
  } catch (err) {
    if (err instanceof KomshipError) {
      return error(err.message, err.code === "NOT_CONFIGURED" ? 503 : 502);
    }
    console.error("[POST /api/admin/delivery/cancel]", err);
    return error("Gagal membatalkan order pengiriman.", 500);
  }
}
