import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

export const dynamic = "force-dynamic";

// GET /api/admin/coupons/[id]
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
      include: {
        _count: { select: { couponUsages: true } },
      },
    });

    if (!coupon) return error("Coupon not found", 404);

    return success(coupon);
  } catch (err) {
    console.error("[GET /api/admin/coupons/[id]]", err);
    return error("Failed to fetch coupon", 500);
  }
}

// PUT /api/admin/coupons/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return error("Unauthorized", 401);
    }

    const { id } = await params;
    const existing = await db.coupon.findUnique({ where: { id } });
    if (!existing) return error("Coupon not found", 404);

    const body = await request.json();
    const { couponSchema } = await import("@/lib/validation");
    const parsed = couponSchema.safeParse(body);
    if (!parsed.success) {
      return error("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const data = parsed.data;
    const popupPriority = typeof body.popupPriority === "number" ? body.popupPriority : null;
    const allowedRegions =
      data.type === "FREE_SHIPPING" && Array.isArray(data.allowedRegions) && data.allowedRegions.length > 0
        ? JSON.stringify(data.allowedRegions)
        : null;
    const coupon = await db.coupon.update({
      where: { id },
      data: {
        code: data.code,
        type: data.type,
        value: data.value,
        minPurchase: data.minPurchase ?? null,
        maxDiscount: data.maxDiscount ?? null,
        usageLimit: data.usageLimit ?? null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: data.isActive,
        applicableCategory: data.applicableCategory ?? null,
        applicableProduct: data.applicableProduct ?? null,
        showAsPopup: data.showAsPopup ?? false,
        popupTitle: data.popupTitle ?? null,
        popupPriority,
        allowedRegions,
      },
    });

    return success(coupon, "Coupon updated");
  } catch (err) {
    console.error("[PUT /api/admin/coupons/[id]]", err);
    return error("Failed to update coupon", 500);
  }
}

// DELETE /api/admin/coupons/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return error("Unauthorized", 401);
    }

    const { id } = await params;
    const existing = await db.coupon.findUnique({ where: { id } });
    if (!existing) return error("Coupon not found", 404);

    await db.coupon.delete({ where: { id } });
    return success(null, "Coupon deleted");
  } catch (err) {
    console.error("[DELETE /api/admin/coupons/[id]]", err);
    return error("Failed to delete coupon", 500);
  }
}
