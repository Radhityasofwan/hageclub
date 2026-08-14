import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiResponse } from "@/lib/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// PATCH /api/orders/[id]/info — update customer/shipping info for PENDING orders
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    const order = await db.order.findUnique({
      where: { id },
      select: { id: true, status: true, userId: true, payment: { select: { status: true } } },
    });

    if (!order) return apiResponse.error("Order tidak ditemukan", 404);
    if (order.status !== "PENDING") return apiResponse.error("Hanya order PENDING yang bisa diubah", 400);
    if (order.payment?.status === "PAID") return apiResponse.error("Order sudah dibayar", 400);

    if (session?.user?.id && order.userId && order.userId !== session.user.id) {
      return apiResponse.error("Tidak diizinkan", 403);
    }

    const body = await request.json().catch(() => ({}));
    const { recipientName, phone, street, district, city, province, postalCode, guestName, guestEmail, guestPhone } = body;

    // Build partial update — only send fields that are provided
    const data: Record<string, unknown> = {};

    if (guestName !== undefined) data.guestName = String(guestName).trim();
    if (guestEmail !== undefined) data.guestEmail = String(guestEmail).trim();
    if (guestPhone !== undefined) data.guestPhone = String(guestPhone).trim();

    if (recipientName || phone || street || district || city || province || postalCode) {
      // Fetch current address to merge partial updates
      const current = await db.order.findUnique({ where: { id }, select: { shippingAddress: true } });
      const currentAddr = (current?.shippingAddress ?? {}) as Record<string, string>;
      data.shippingAddress = {
        ...currentAddr,
        ...(recipientName ? { recipientName: String(recipientName).trim() } : {}),
        ...(phone ? { phone: String(phone).trim() } : {}),
        ...(street ? { street: String(street).trim() } : {}),
        ...(district ? { district: String(district).trim() } : {}),
        ...(city ? { city: String(city).trim() } : {}),
        ...(province ? { province: String(province).trim() } : {}),
        ...(postalCode ? { postalCode: String(postalCode).trim() } : {}),
      };
    }

    if (Object.keys(data).length === 0) {
      return apiResponse.error("Tidak ada data yang diperbarui", 400);
    }

    await db.order.update({ where: { id }, data });

    return apiResponse.success({ updated: true }, "Info pemesan berhasil diperbarui");
  } catch (err) {
    console.error("[PATCH /api/orders/:id/info]", err);
    return apiResponse.error(err instanceof Error ? err.message : "Gagal memperbarui info", 500);
  }
}
