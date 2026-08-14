import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

export const dynamic = "force-dynamic";

// POST /api/promotions/[id]/claim
// Auth required — persists claim to VoucherClaim, returns coupon code
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return error("Login untuk mengklaim promo ini", 401);

    const { id } = await params;
    const now = new Date();

    const coupon = await db.coupon.findFirst({
      where: {
        id,
        showAsPopup: true,
        isActive: true,
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
      select: {
        id: true,
        code: true,
        usageLimit: true,
        usedCount: true,
      },
    });

    if (!coupon) return error("Promo tidak ditemukan atau sudah tidak aktif", 404);
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return error("Kuota promo sudah habis", 410);
    }

    // Persist claim — upsert so re-claiming returns same code without error
    await db.voucherClaim.upsert({
      where: { userId_couponId: { userId: session.user.id, couponId: coupon.id } },
      create: { userId: session.user.id, couponId: coupon.id },
      update: {},
    });

    return success({ code: coupon.code });
  } catch (err) {
    console.error("[POST /api/promotions/[id]/claim]", err);
    return error("Gagal mengklaim promo", 500);
  }
}
