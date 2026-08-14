import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { success, error } from "@/lib/api-response";
import { calculateShipping, getKomshipSettings } from "@/lib/komship";
import { loadOrderForDelivery } from "@/lib/delivery";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  orderId: z.string().min(1),
  destinationId: z.coerce.number().int().positive(),
});

// POST /api/admin/delivery/calculate — hitung ulang tarif saat admin
// mengganti candidate destination pada modal pengiriman.
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

  const config = await getKomshipSettings();
  if (!config.shipperDestinationId) {
    return error("Wilayah asal (shipper destination) belum diatur di Settings Komship.", 400);
  }

  const calculate = await calculateShipping({
    shipperDestinationId: config.shipperDestinationId,
    receiverDestinationId: parsed.data.destinationId,
    weightKg: order.weightKg,
    itemValue: order.itemValue,
  });

  return success({ calculate });
}
