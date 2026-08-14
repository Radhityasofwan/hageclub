import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { success, error } from "@/lib/api-response";
import { getKomshipSettings } from "@/lib/komship";
import { searchDestinations, calculateShipping } from "@/lib/komship";
import { loadOrderForDelivery } from "@/lib/delivery";
import type { KomshipDestination } from "@/types";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({ orderId: z.string().min(1) });

// POST /api/admin/delivery/prepare — siapkan data pengiriman untuk order:
// cari destination receiver (via zip/district), hitung tarif live Komship.
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
  if (order.deliveryOrderNo) {
    return error("Order sudah dibuat di Komship (deliveryOrderNo sudah terisi).", 409);
  }

  const config = await getKomshipSettings();
  if (!config.apiKey || !config.baseUrl) {
    return success({
      configured: false,
      message:
        "API Komship belum dikonfigurasi. Lengkapi API key & profil pengirim di Admin → Settings → Pengiriman.",
    });
  }

  const address = order.shippingAddress;
  // Cari lokasi tujuan: prioritaskan kode pos, lalu nama kecamatan/kota
  const keywords = [address.postalCode, address.district, address.city].filter(
    (k) => k && k.trim().length >= 2
  );
  let candidates: KomshipDestination[] = [];
  for (const kw of keywords) {
    candidates = await searchDestinations(kw);
    if (candidates.length > 0) break;
  }

  const destinationId = candidates[0]?.id;
  let calculate = null;
  let destinationLabel = "";
  if (destinationId && config.shipperDestinationId) {
    destinationLabel = candidates[0].label;
    try {
      calculate = await calculateShipping({
        shipperDestinationId: config.shipperDestinationId,
        receiverDestinationId: destinationId,
        weightKg: order.weightKg,
        itemValue: order.itemValue,
      });
    } catch (err) {
      console.error("[POST /api/admin/delivery/prepare] calculate failed", err);
    }
  }

  return success({
    configured: true,
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      courier: order.courier,
      courierService: order.courierService,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      total: order.total,
      note: order.note,
    },
    receiver: {
      name: address.recipientName,
      phone: address.phone,
      street: address.street,
      district: address.district,
      city: address.city,
      province: address.province,
      postalCode: address.postalCode,
      locationLabel: address.locationLabel,
    },
    weightKg: order.weightKg,
    itemValue: order.itemValue,
    preferredCourier: order.preferredCourier,
    candidates,
    destinationId: destinationId ?? null,
    destinationLabel,
    calculate,
    shipperReady: Boolean(config.shipperDestinationId),
  });
}
