import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { success, error } from "@/lib/api-response";
import { db } from "@/lib/db";
import { requestPickup, getKomshipSettings, KomshipError } from "@/lib/komship";
import { loadOrderForDelivery } from "@/lib/delivery";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  orderId: z.string().min(1),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal YYYY-MM-DD"),
  pickupTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Format jam HH:mm"),
  pickupVehicle: z.enum(["Motor", "Mobil", "Truk"]),
});

// POST /api/admin/delivery/pickup — jadwalkan penjemputan paket ke kurir
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

  // Aturan kendaraan per dokumen resmi: motor maks 5 kg/order, truk wajib >=10 kg
  if (parsed.data.pickupVehicle === "Motor" && order.weightKg > 5) {
    return error(
      `Kendaraan Motor maksimal 5 kg per order — berat paket ${order.weightKg} kg. Pilih Mobil atau Truk.`,
      400
    );
  }
  if (parsed.data.pickupVehicle === "Truk" && order.weightKg < 10) {
    return error(
      `Kendaraan Truk hanya untuk paket minimal 10 kg — berat paket ${order.weightKg} kg. Pilih Motor atau Mobil.`,
      400
    );
  }

  const pickupTime = parsed.data.pickupTime.length === 5 ? `${parsed.data.pickupTime}:00` : parsed.data.pickupTime;

  try {
    const results = await requestPickup({
      pickupDate: parsed.data.pickupDate,
      pickupTime,
      pickupVehicle: parsed.data.pickupVehicle,
      orderNos: [order.deliveryOrderNo],
    });

    const result = results[0];
    if (!result || result.status !== "success") {
      return error(
        result?.status === "failed"
          ? `Pickup gagal untuk order ${result.orderNo}.`
          : "Komship tidak mengembalikan hasil pickup.",
        502
      );
    }

    await db.order.update({
      where: { id: order.id },
      data: {
        trackingNumber: result.awb || order.trackingNumber,
        deliveryStatus: "Dijemput",
      },
    });

    return success({
      status: result.status,
      awb: result.awb,
      orderNo: result.orderNo,
    });
  } catch (err) {
    if (err instanceof KomshipError) {
      return error(err.message, err.code === "NOT_CONFIGURED" ? 503 : 502);
    }
    console.error("[POST /api/admin/delivery/pickup]", err);
    return error("Gagal menjadwalkan pickup.", 500);
  }
}
