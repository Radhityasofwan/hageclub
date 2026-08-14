import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

export const dynamic = "force-dynamic";

// GET /api/admin/coupons/[id]/usage
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return error("Unauthorized", 401);
    }

    const { id } = await params;
    const coupon = await db.coupon.findUnique({
      where: { id },
      select: { id: true, code: true, usedCount: true, usageLimit: true },
    });
    if (!coupon) return error("Coupon not found", 404);

    const usages = await db.couponUsage.findMany({
      where: { couponId: id },
      orderBy: { usedAt: "desc" },
      take: 50,
      include: {
        order: {
          select: { orderNumber: true, total: true },
        },
        user: {
          select: {
            email: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    const mapped = usages.map((u) => ({
      id: u.id,
      orderNumber: u.order.orderNumber,
      orderTotal: u.order.total,
      usedAt: u.usedAt,
      customer: u.user?.profile
        ? `${u.user.profile.firstName} ${u.user.profile.lastName}`.trim()
        : u.user?.email ?? "Guest",
    }));

    return success({ coupon, usages: mapped });
  } catch (err) {
    console.error("[GET /api/admin/coupons/[id]/usage]", err);
    return error("Failed to fetch usage history", 500);
  }
}
