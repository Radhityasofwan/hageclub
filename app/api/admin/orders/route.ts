import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { success, error } from "@/lib/api-response";

export const dynamic = "force-dynamic";

// GET /api/admin/orders?page=1&limit=20&status=&search=
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "EDITOR", "CS"].includes(session.user.role)) {
      return error("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
    const skip = (page - 1) * limit;
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    const where: Record<string, unknown> = {};

    if (status && [
      "PENDING", "PAID", "PROCESSING", "PACKED",
      "SHIPPED", "DELIVERED", "COMPLETED", "CANCELLED", "REFUNDED",
    ].includes(status)) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { guestName: { contains: search } },
        { guestEmail: { contains: search } },
      ];
    }

    if (dateFrom || dateTo) {
      const createdAt: Record<string, Date> = {};
      if (dateFrom) createdAt.gte = new Date(dateFrom);
      if (dateTo) createdAt.lte = new Date(dateTo + "T23:59:59.999Z");
      where.createdAt = createdAt;
    }

    const [orders, total] = await db.$transaction([
      db.order.findMany({
        where: where as Prisma.OrderWhereInput,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          subtotal: true,
          discount: true,
          shippingCost: true,
          courier: true,
          courierService: true,
          guestName: true,
          guestEmail: true,
          createdAt: true,
          user: {
            select: {
              email: true,
              profile: { select: { firstName: true, lastName: true } },
            },
          },
          payment: { select: { method: true, status: true } },
          items: {
            select: { quantity: true },
          },
        },
      }),
      db.order.count({ where: where as Prisma.OrderWhereInput }),
    ]);

    const mapped = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      total: o.total,
      subtotal: o.subtotal,
      discount: o.discount,
      shippingCost: o.shippingCost,
      courier: o.courier,
      courierService: o.courierService,
      createdAt: o.createdAt,
      payment: o.payment,
      itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
      customer:
        o.guestName ??
        (o.user?.profile
          ? `${o.user.profile.firstName} ${o.user.profile.lastName}`.trim()
          : o.user?.email ?? "Guest"),
    }));

    return success({
      orders: mapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[GET /api/admin/orders]", err);
    return error("Failed to fetch orders", 500);
  }
}
