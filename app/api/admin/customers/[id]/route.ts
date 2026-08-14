import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { z } from "zod";

export const dynamic = "force-dynamic";

const PAID_STATUSES = ["PAID", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "COMPLETED"] as const;

const updateSchema = z.object({
  adminNotes: z.string().max(5000).optional().nullable(),
});

// GET /api/admin/customers/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "EDITOR", "CS"].includes(session.user.role)) {
      return error("Unauthorized", 401);
    }

    const { id } = await params;
    const user = await db.user.findUnique({
      where: { id },
      include: {
        profile: true,
        addresses: { orderBy: { isDefault: "desc" } },
      },
    });

    if (!user || user.role !== "CUSTOMER") {
      return error("Customer not found", 404);
    }

    const [paidStats, allOrderStats, orders, wishlistCount, voucherClaims, couponUsages] = await Promise.all([
      // Paid orders: totalSpent + paidOrders count
      db.order.aggregate({
        where: { userId: id, status: { in: [...PAID_STATUSES] } },
        _count: true,
        _sum: { total: true },
      }),
      // All active orders count + last order date
      db.order.aggregate({
        where: { userId: id, status: { notIn: ["CANCELLED", "REFUNDED"] } },
        _count: true,
        _max: { createdAt: true },
      }),
      // Full order history
      db.order.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          discount: true,
          createdAt: true,
          coupon: { select: { code: true } },
          payment: { select: { method: true, status: true } },
        },
      }),
      // Wishlist count
      db.wishlist.count({ where: { userId: id } }),
      // Voucher claims with coupon detail
      db.voucherClaim.findMany({
        where: { userId: id },
        include: { coupon: { select: { code: true, type: true, value: true, endDate: true, isActive: true } } },
        orderBy: { claimedAt: "desc" },
        take: 20,
      }),
      // Coupon usages (actual order usage)
      db.couponUsage.findMany({
        where: { userId: id },
        select: { couponId: true },
      }),
    ]);

    const usedCouponIds = new Set(couponUsages.map((u) => u.couponId));
    const totalSpent = paidStats._sum.total ?? 0;
    const paidOrdersCount = paidStats._count;
    const totalOrders = allOrderStats._count;
    const lastOrderAt = allOrderStats._max.createdAt ?? null;
    const avgOrderValue = paidOrdersCount > 0 ? Math.floor(totalSpent / paidOrdersCount) : 0;

    const segment =
      totalSpent >= 5_000_000 ? "VIP"
      : paidOrdersCount >= 2 ? "REGULAR"
      : "NEW";

    const now = new Date();
    const claims = voucherClaims.map((vc) => {
      const isExpired = vc.coupon.endDate ? new Date(vc.coupon.endDate) < now : false;
      const isUsed = usedCouponIds.has(vc.couponId);
      return {
        id: vc.id,
        code: vc.coupon.code,
        type: vc.coupon.type,
        value: vc.coupon.value,
        claimedAt: vc.claimedAt,
        status: isUsed ? "USED" : isExpired ? "EXPIRED" : "UNUSED",
      };
    });

    return success({
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      joinedAt: user.createdAt,
      profile: user.profile,
      adminNotes: user.profile?.adminNotes ?? null,
      addresses: user.addresses,
      segment,
      totalOrders,
      paidOrders: paidOrdersCount,
      totalSpent,
      avgOrderValue,
      lastOrderAt,
      wishlistCount,
      orders: orders.map((o) => ({ ...o, couponCode: o.coupon?.code ?? null, coupon: undefined })),
      voucherClaims: claims,
    });
  } catch (err) {
    console.error("[GET /api/admin/customers/[id]]", err);
    return error("Failed to fetch customer", 500);
  }
}

// PATCH /api/admin/customers/[id] — save admin CRM notes
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return error("Unauthorized", 401);
    }

    const { id } = await params;
    const user = await db.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!user || user.role !== "CUSTOMER") return error("Customer not found", 404);

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return error("Invalid data", 400);

    await db.profile.upsert({
      where: { userId: id },
      update: { adminNotes: parsed.data.adminNotes ?? null },
      create: {
        userId: id,
        firstName: "",
        lastName: "",
        adminNotes: parsed.data.adminNotes ?? null,
      },
    });

    return success(null, "Notes saved");
  } catch (err) {
    console.error("[PATCH /api/admin/customers/[id]]", err);
    return error("Failed to update customer", 500);
  }
}
