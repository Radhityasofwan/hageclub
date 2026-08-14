import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { success, error } from "@/lib/api-response";
import { db } from "@/lib/db";
import { printLabel, getKomshipSettings, KomshipError } from "@/lib/komship";
import { loadOrderForDelivery } from "@/lib/delivery";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  orderId: z.string().min(1),
  page: z.enum(["page_1", "page_2", "page_4", "page_5", "page_6"]),
});

// POST /api/admin/delivery/label — generate label pengiriman (PDF base64)
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
    return error("Order belum dibuat di Komship. Buat pengiriman terlebih dahulu.", 400);
  }

  const config = await getKomshipSettings();
  if (!config.apiKey) {
    return error("API key Komship belum dikonfigurasi.", 503);
  }

  try {
    const label = await printLabel(order.deliveryOrderNo, parsed.data.page);

    if (label.base64) {
      await db.order.update({
        where: { id: order.id },
        data: { deliveryLabelPath: label.path || order.deliveryLabelPath },
      });
    }

    return success({
      path: label.path,
      base64: label.base64,
      fileName: `label-${order.orderNumber}.pdf`,
    });
  } catch (err) {
    if (err instanceof KomshipError) {
      return error(err.message, err.code === "NOT_CONFIGURED" ? 503 : 502);
    }
    console.error("[POST /api/admin/delivery/label]", err);
    return error("Gagal membuat label.", 500);
  }
}
