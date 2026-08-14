import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiResponse } from "@/lib/api-response";
import { getCost, getOriginCityId, getActiveCouriers } from "@/lib/rajaongkir";

// GET /api/orders/[id]/shipping-options — available couriers for an existing order
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await db.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        shippingAddress: true,
        items: {
          select: { productId: true, variantId: true, quantity: true },
        },
      },
    });

    if (!order) return apiResponse.error("Order tidak ditemukan", 404);
    if (order.status !== "PENDING") return apiResponse.error("Hanya order PENDING", 400);

    const addr = (order.shippingAddress ?? {}) as Record<string, unknown>;
    const locationId = typeof addr.locationId === "string" ? addr.locationId : null;
    if (!locationId) {
      return apiResponse.error("Lokasi tujuan tidak tersimpan di order ini", 400);
    }

    const origin = await getOriginCityId();
    if (!origin) return apiResponse.error("Kota asal belum dikonfigurasi", 503);

    // Compute total weight from product + variant weights
    const productIds = order.items.map((i) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, weight: true },
    });
    const productWeightMap = Object.fromEntries(products.map((p) => [p.id, p.weight]));

    const totalWeight = order.items.reduce((sum, item) => {
      return sum + (productWeightMap[item.productId] ?? 0) * item.quantity;
    }, 0);

    const couriers = await getActiveCouriers();
    const result = await getCost(origin, locationId, Math.max(totalWeight, 250), couriers);

    const options = result.costs.flatMap((c) =>
      c.services.map((s) => ({
        courier: c.courier,
        service: s.service,
        description: s.description,
        cost: s.cost,
        etd: s.etd,
      }))
    );

    return apiResponse.success({ options, totalWeight });
  } catch (err) {
    console.error("[GET /api/orders/:id/shipping-options]", err);
    return apiResponse.error("Gagal mengambil opsi pengiriman", 500);
  }
}
