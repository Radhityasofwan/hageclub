import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { success, error } from "@/lib/api-response";
import { couponSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

// GET /api/admin/coupons?page&search
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return error("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.CouponWhereInput = {};
    const search = searchParams.get("search") || "";
    if (search) where.code = { contains: search };
    if (searchParams.get("popup") === "true") where.showAsPopup = true;

    const [coupons, total] = await db.$transaction([
      db.coupon.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { _count: { select: { couponUsages: true } } },
      }),
      db.coupon.count({ where }),
    ]);

    return success({
      coupons,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[GET /api/admin/coupons]", err);
    return error("Failed to fetch coupons", 500);
  }
}

// POST /api/admin/coupons
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return error("Unauthorized", 401);
    }

    const body = await request.json();
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
    const coupon = await db.coupon.create({
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

    return success(coupon, "Coupon created", 201);
  } catch (err) {
    console.error("[POST /api/admin/coupons]", err);
    return error("Failed to create coupon", 500);
  }
}
