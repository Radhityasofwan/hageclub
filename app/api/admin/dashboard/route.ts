import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "EDITOR", "CS"].includes(session.user.role)) {
      return error("Unauthorized", 401);
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );

    // Run aggregations in parallel
    const [
      totalOrders,
      monthOrders,
      lastMonthOrders,
      totalRevenue,
      monthRevenue,
      lastMonthRevenue,
      totalProducts,
      totalCustomers,
      monthCustomers,
      lastMonthCustomers,
      pendingOrders,
      processingOrders,
      recentOrders,
    ] = await Promise.all([
      db.order.count(),
      db.order.count({ where: { createdAt: { gte: startOfMonth } } }),
      db.order.count({
        where: {
          createdAt: { gte: startOfLastMonth, lt: startOfMonth },
        },
      }),
      db.order.aggregate({ _sum: { total: true } }),
      db.order.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: startOfMonth } },
      }),
      db.order.aggregate({
        _sum: { total: true },
        where: {
          createdAt: { gte: startOfLastMonth, lt: startOfMonth },
        },
      }),
      db.product.count(),
      db.user.count({ where: { role: "CUSTOMER" } }),
      db.user.count({
        where: {
          role: "CUSTOMER",
          createdAt: { gte: startOfMonth },
        },
      }),
      db.user.count({
        where: {
          role: "CUSTOMER",
          createdAt: { gte: startOfLastMonth, lt: startOfMonth },
        },
      }),
      db.order.count({ where: { status: "PENDING" } }),
      db.order.count({ where: { status: "PROCESSING" } }),
      db.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
          guestName: true,
          user: {
            select: {
              profile: { select: { firstName: true, lastName: true } },
            },
          },
          payment: { select: { method: true } },
        },
      }),
    ]);

    const ordersWithCustomer = recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      total: o.total,
      createdAt: o.createdAt,
      paymentMethod: o.payment?.method ?? null,
      customer:
        o.guestName ??
        (o.user?.profile
          ? `${o.user.profile.firstName} ${o.user.profile.lastName}`.trim()
          : "Guest"),
    }));

    // Compute trends
    const orderTrend = formatTrend(monthOrders, lastMonthOrders);
    const monthRev = monthRevenue._sum.total ?? 0;
    const lastMonthRev = lastMonthRevenue._sum.total ?? 0;
    const revenueTrend = formatTrend(monthRev, lastMonthRev);
    const customerTrend = formatTrend(monthCustomers, lastMonthCustomers);

    return success({
      stats: {
        totalOrders: {
          value: totalOrders,
          subtitle: `${monthOrders} this month`,
          trend: orderTrend,
        },
        totalRevenue: {
          value: totalRevenue._sum.total ?? 0,
          subtitle: formatRevenueTrend(monthRev, lastMonthRev),
          trend: revenueTrend,
        },
        totalProducts: {
          value: totalProducts,
          subtitle: "Active products",
        },
        totalCustomers: {
          value: totalCustomers,
          subtitle: `${monthCustomers} new this month`,
          trend: customerTrend,
        },
        pendingOrders: {
          value: pendingOrders,
          subtitle: "Awaiting payment",
        },
        processingOrders: {
          value: processingOrders,
          subtitle: "Need attention",
        },
      },
      recentOrders: ordersWithCustomer,
    });
  } catch (err) {
    console.error("[GET /api/admin/dashboard]", err);
    return error("Failed to load dashboard", 500);
  }
}

function formatTrend(
  current: number,
  previous: number
): { direction: "up" | "down"; label: string } | undefined {
  if (previous === 0) return undefined;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return undefined;
  return {
    direction: pct > 0 ? "up" : "down",
    label: `${Math.abs(pct)}% vs last month`,
  };
}

function formatRevenueTrend(current: number, previous: number): string {
  const pct =
    previous > 0
      ? ` (${Math.round(((current - previous) / previous) * 100)}%)`
      : "";
  return `IDR ${(current / 1000).toFixed(0)}k this month${pct}`;
}
