import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { success, error } from "@/lib/api-response";
import { db } from "@/lib/db";
import {
  storeOrder,
  getKomshipSettings,
  normalizePhone,
  calculateInsuranceValue,
} from "@/lib/komship";
import { loadOrderForDelivery } from "@/lib/delivery";
import { z } from "zod";

export const dynamic = "force-dynamic";

const serviceSchema = z.object({
  shippingName: z.string().min(1),
  serviceName: z.string().min(1),
  shippingCost: z.number().nonnegative(),
  shippingCashback: z.number().nonnegative(),
});

const schema = z.object({
  orderId: z.string().min(1),
  destinationId: z.coerce.number().int().positive(),
  destinationLabel: z.string().optional(),
  service: serviceSchema,
});

// POST /api/admin/delivery/store-order — buat order pengiriman di Komship
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
    return error("Order sudah dibuat di Komship.", 409);
  }

  const config = await getKomshipSettings();
  if (!config.apiKey) {
    return error("API key Komship belum dikonfigurasi.", 503);
  }
  if (!config.shipperDestinationId) {
    return error("Wilayah asal pengirim belum diatur di Settings Komship.", 400);
  }
  if (!config.brandName || !config.shipperName || !config.shipperPhone || !config.shipperEmail || !config.shipperAddress) {
    return error("Profil pengirim belum lengkap di Settings Komship.", 400);
  }

  const address = order.shippingAddress;
  const { service } = parsed.data;
  const isCod = false; // store ini prepaid (VA/QRIS/EWALLET) → selalu BANK TRANSFER di Komship

  // commodity_code WAJIB untuk kurir LION (dokumen delivery bagian store order)
  if (
    service.shippingName.toUpperCase() === "LION" &&
    !(config.commodityCode ?? "").trim()
  ) {
    return error(
      "Kurir LION mewajibkan Commodity Code. Isi di Settings → Pengiriman (Komship) → Preferensi Pengiriman, lalu coba lagi.",
      400
    );
  }

  const delivery = await storeOrder({
    orderDate: new Date().toISOString().slice(0, 10),
    brandName: config.brandName,
    shipperName: config.shipperName,
    shipperPhone: normalizePhone(config.shipperPhone),
    shipperDestinationId: Number(config.shipperDestinationId),
    shipperAddress: config.shipperAddress,
    shipperEmail: config.shipperEmail,
    receiverName: address.recipientName,
    receiverPhone: normalizePhone(address.phone),
    receiverDestinationId: parsed.data.destinationId,
    receiverAddress: `${address.street}, ${address.district}, ${address.city}, ${address.province} ${address.postalCode}`.trim(),
    shipping: service.shippingName,
    shippingType: service.serviceName,
    paymentMethod: isCod ? "COD" : "BANK TRANSFER",
    shippingCost: service.shippingCost,
    shippingCashback: service.shippingCashback,
    serviceFee: 0, // BANK TRANSFER → service_fee = 0 (dokumen bagian 6)
    additionalCost: 0,
    grandTotal: order.total,
    codValue: 0,
    insuranceValue: calculateInsuranceValue(service.shippingName, order.itemValue, order.total),
    originPinPoint: config.originPinPoint || undefined,
    commodityCode:
      service.shippingName.toUpperCase() === "LION" ? config.commodityCode || undefined : undefined,
    notes: order.note ?? undefined,
    orderDetails: order.items.map((it) => ({
      productName: it.name,
      productVariantName: it.variantName,
      productPrice: it.price,
      productWeight: Math.max(1, it.weight),
      productWidth: it.width || 1,
      productHeight: it.height || 1,
      productLength: it.length || 1,
      qty: it.quantity,
      subtotal: it.subtotal,
    })),
  });

  if (!delivery.orderNo) {
    return error("Komship tidak mengembalikan nomor order.", 502);
  }

  await db.order.update({
    where: { id: order.id },
    data: {
      deliveryOrderNo: delivery.orderNo,
      deliveryStatus: "Diajukan",
    },
  });

  return success({
    orderId: delivery.orderId,
    deliveryOrderNo: delivery.orderNo,
  });
}
