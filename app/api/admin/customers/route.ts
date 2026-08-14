import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const PAID_STATUSES = ["PAID", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "COMPLETED"] as const;
const ACTIVE_STATUSES = ["PAID", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "COMPLETED", "PENDING"] as const;

// GET /api/admin/customers?search=&segment=&sort=&page=
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
    const search = searchParams.get("search") || "";
    const segment = searchParams.get("segment") || ""; // NEW | REGULAR | VIP
    const sort = searchParams.get("sort") || "joined_desc"; // joined_desc | spent_desc | orders_desc | last_order_desc

    const where: Prisma.UserWhereInput = { role: "CUSTOMER" };
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { profile: { firstName: { contains: search } } },
        { profile: { lastName: { contains: search } } },
        { profile: { phone: { contains: search } } },
      ];
    }

    const [users, total] = await db.$transaction([
      db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          emailVerified: true,
          createdAt: true,
          profile: { select: { firstName: true, lastName: true, phone: true } },
        },
        orderBy: sort === "joined_desc" ? { createdAt: "desc" } : { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    const userIds = users.map((u) => u.id);

    // Fetch paid order stats + last order date in one query
    const [orderStats, lastOrders] = await Promise.all([
      db.order.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds }, status: { in: [...PAID_STATUSES] } },
        _sum: { total: true },
        _count: true,
      }),
      db.order.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds }, status: { in: [...ACTIVE_STATUSES] } },
        _max: { createdAt: true },
        _count: true,
      }),
    ]);

    const spentMap = new Map(orderStats.map((s) => [s.userId, { spent: s._sum.total ?? 0, paidOrders: s._count }]));
    const lastOrderMap = new Map(lastOrders.map((s) => [s.userId, { lastOrderAt: s._max.createdAt, totalOrders: s._count }]));

    let customers = users.map((u) => {
      const stats = spentMap.get(u.id);
      const last = lastOrderMap.get(u.id);
      const totalSpent = stats?.spent ?? 0;
      const totalOrders = last?.totalOrders ?? 0;
      const paidOrders = stats?.paidOrders ?? 0;
      const lastOrderAt = last?.lastOrderAt ?? null;

      const seg =
        totalSpent >= 5_000_000 ? "VIP"
        : paidOrders >= 2 ? "REGULAR"
        : "NEW";

      return {
        id: u.id,
        email: u.email,
        emailVerified: u.emailVerified,
        name: u.profile ? `${u.profile.firstName} ${u.profile.lastName}`.trim() : u.email.split("@")[0],
        phone: u.profile?.phone ?? null,
        totalOrders,
        paidOrders,
        totalSpent,
        lastOrderAt,
        joinedAt: u.createdAt,
        segment: seg,
      };
    });

    // Segment filter (post-processing — totalSpent calculated in-memory)
    if (segment && ["NEW", "REGULAR", "VIP"].includes(segment)) {
      customers = customers.filter((c) => c.segment === segment);
    }

    // Sort
    if (sort === "spent_desc") {
      customers.sort((a, b) => b.totalSpent - a.totalSpent);
    } else if (sort === "orders_desc") {
      customers.sort((a, b) => b.totalOrders - a.totalOrders);
    } else if (sort === "last_order_desc") {
      customers.sort((a, b) => {
        if (!a.lastOrderAt && !b.lastOrderAt) return 0;
        if (!a.lastOrderAt) return 1;
        if (!b.lastOrderAt) return -1;
        return new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime();
      });
    }
    // default: joined_desc already applied in DB query

    // Re-paginate after in-memory filter (only when segment filter active)
    const filteredTotal = segment ? customers.length : total;
    const pagedCustomers = segment ? customers.slice(skip, skip + limit) : customers;

    return success({
      customers: pagedCustomers,
      total: filteredTotal,
      page,
      limit,
      totalPages: Math.ceil(filteredTotal / limit),
    });
  } catch (err) {
    console.error("[GET /api/admin/customers]", err);
    return error("Failed to fetch customers", 500);
  }
}
