import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

export const dynamic = "force-dynamic";

// GET /api/coupons — daftar kupon aktif untuk ditampilkan ke publik
export async function GET() {
  try {
    const now = new Date();
    const coupons = await db.coupon.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
      select: {
        id: true,
        code: true,
        type: true,
        value: true,
        minPurchase: true,
        maxDiscount: true,
        endDate: true,
        popupTitle: true,
        usageLimit: true,
        usedCount: true,
        allowedRegions: true,
      },
      orderBy: [{ popupPriority: "asc" }, { createdAt: "desc" }],
    });

    // Filter kupon yang masih dalam batas penggunaan
    const filtered = coupons.filter(
      (c) => c.usageLimit === null || c.usedCount < c.usageLimit
    );

    return success(filtered);
  } catch (err) {
    console.error("[GET /api/coupons]", err);
    return error("Failed to fetch coupons", 500);
  }
}
