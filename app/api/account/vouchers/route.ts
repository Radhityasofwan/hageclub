import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return error("Unauthorized", 401);
    const userId = session.user.id;
    const now = new Date();

    const couponSelect = {
      id: true, code: true, type: true, value: true,
      minPurchase: true, maxDiscount: true,
      usageLimit: true, usedCount: true,
      endDate: true, isActive: true,
    } as const;

    // 1. VoucherClaim records (popup claims)
    const claims = await db.voucherClaim.findMany({
      where: { userId },
      orderBy: { claimedAt: "desc" },
      select: { id: true, claimedAt: true, couponId: true, coupon: { select: couponSelect } },
    });

    // 2. CouponUsage records (used in orders)
    const usages = await db.couponUsage.findMany({
      where: { userId },
      orderBy: { usedAt: "desc" },
      select: {
        id: true, couponId: true, usedAt: true,
        coupon: { select: couponSelect },
        order: { select: { id: true, orderNumber: true } },
      },
    });

    const usageMap = new Map(usages.map((u) => [u.couponId, u]));
    const claimedIds = new Set(claims.map((c) => c.couponId));

    const computeStatus = (
      coupon: { isActive: boolean; endDate: Date | null; usageLimit: number | null; usedCount: number },
      hasUsage: boolean,
    ): "UNUSED" | "USED" | "EXPIRED" => {
      if (hasUsage) return "USED";
      if (!coupon.isActive) return "EXPIRED";
      if (coupon.endDate && coupon.endDate < now) return "EXPIRED";
      if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) return "EXPIRED";
      return "UNUSED";
    };

    // Merge: VoucherClaim entries first
    const fromClaims = claims.map((claim) => {
      const usage = usageMap.get(claim.couponId) ?? null;
      return {
        id: claim.id,
        claimedAt: claim.claimedAt,
        status: computeStatus(claim.coupon, !!usage),
        coupon: claim.coupon,
        usage: usage ? { orderId: usage.order.id, orderNumber: usage.order.orderNumber, usedAt: usage.usedAt } : null,
      };
    });

    // Historical: CouponUsage without a VoucherClaim (used before claim feature existed)
    const fromUsageOnly = usages
      .filter((u) => !claimedIds.has(u.couponId))
      .map((u) => ({
        id: `usage_${u.id}`,
        claimedAt: u.usedAt,
        status: "USED" as const,
        coupon: u.coupon,
        usage: { orderId: u.order.id, orderNumber: u.order.orderNumber, usedAt: u.usedAt },
      }));

    return success([...fromClaims, ...fromUsageOnly]);
  } catch (err) {
    console.error("[GET /api/account/vouchers]", err);
    return error("Gagal memuat voucher", 500);
  }
}
