import { db } from "@/lib/db";
import { StatCard } from "@/components/admin/stat-card";
import { RecentOrdersTable } from "@/components/admin/recent-orders-table";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalOrders,
    monthOrders,
    lastMonthOrders,
    totalRevenueAgg,
    monthRevenueAgg,
    lastMonthRevenueAgg,
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
    db.order.count({ where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } } }),
    db.order.aggregate({ _sum: { total: true } }),
    db.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: startOfMonth } } }),
    db.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } } }),
    db.product.count(),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.user.count({ where: { role: "CUSTOMER", createdAt: { gte: startOfMonth } } }),
    db.user.count({ where: { role: "CUSTOMER", createdAt: { gte: startOfLastMonth, lt: startOfMonth } } }),
    db.order.count({ where: { status: "PENDING" } }),
    db.order.count({ where: { status: "PROCESSING" } }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        guestName: true,
        user: { select: { profile: { select: { firstName: true, lastName: true } } } },
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

  const calc = (a: number, b: number) =>
    b > 0 ? Math.round(((a - b) / b) * 100) : 0;

  const monthRev = monthRevenueAgg._sum.total ?? 0;
  const lastMonthRev = lastMonthRevenueAgg._sum.total ?? 0;

  return {
    stats: {
      totalOrders: {
        value: totalOrders,
        subtitle: `${monthOrders} bulan ini`,
        trend: lastMonthOrders > 0
          ? ({ direction: calc(monthOrders, lastMonthOrders) >= 0 ? "up" : "down", label: `${Math.abs(calc(monthOrders, lastMonthOrders))}% vs bulan lalu` } as const)
          : undefined,
      },
      totalRevenue: {
        value: formatPrice(totalRevenueAgg._sum.total ?? 0),
        subtitle: `${formatPrice(monthRev)} bulan ini`,
        trend: lastMonthRev > 0
          ? ({ direction: calc(monthRev, lastMonthRev) >= 0 ? "up" : "down", label: `${Math.abs(calc(monthRev, lastMonthRev))}% vs bulan lalu` } as const)
          : undefined,
      },
      totalProducts: { value: totalProducts, subtitle: "Produk aktif" },
      totalCustomers: {
        value: totalCustomers,
        subtitle: `${monthCustomers} baru bulan ini`,
        trend: lastMonthCustomers > 0
          ? ({ direction: calc(monthCustomers, lastMonthCustomers) >= 0 ? "up" : "down", label: `${Math.abs(calc(monthCustomers, lastMonthCustomers))}% vs bulan lalu` } as const)
          : undefined,
      },
    },
    orders: ordersWithCustomer,
    pendingOrders,
    processingOrders,
  };
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-primary">Dashboard</h1>
          <p className="text-xs text-muted mt-0.5">
            Ringkasan performa toko hari ini
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/orders"
            className="h-8 px-3 bg-primary text-white text-xs font-medium rounded flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
          >
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
              <path d="M2 2h10v10H2zM4 5h6M4 7.5h4" strokeLinecap="round" />
            </svg>
            Semua Order
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Total Order"
          value={data.stats.totalOrders.value}
          subtitle={data.stats.totalOrders.subtitle}
          trend={data.stats.totalOrders.trend}
          icon={
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M2 2h12v12H2zM5 6h6M5 9h4" strokeLinecap="round" />
            </svg>
          }
        />
        <StatCard
          title="Revenue"
          value={data.stats.totalRevenue.value}
          subtitle={data.stats.totalRevenue.subtitle}
          trend={data.stats.totalRevenue.trend}
          icon={
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M3 11l3-3 2 2 5-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        <StatCard
          title="Produk"
          value={data.stats.totalProducts.value}
          subtitle={data.stats.totalProducts.subtitle}
          icon={
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" />
            </svg>
          }
        />
        <StatCard
          title="Customer"
          value={data.stats.totalCustomers.value}
          subtitle={data.stats.totalCustomers.subtitle}
          trend={data.stats.totalCustomers.trend}
          icon={
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <circle cx="8" cy="5" r="3" />
              <path d="M1 14c0-3 3-5 7-5s7 2 7 5" strokeLinecap="round" />
            </svg>
          }
        />
      </div>

      {/* Alert chips */}
      {(data.pendingOrders > 0 || data.processingOrders > 0) && (
        <div className="flex flex-wrap gap-2">
          {data.pendingOrders > 0 && (
            <Link
              href="/admin/orders?status=PENDING"
              className="inline-flex items-center gap-2 h-8 px-3 bg-white border border-border rounded text-xs hover:border-warning hover:text-warning transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" />
              <span className="font-medium">{data.pendingOrders}</span>
              <span className="text-muted">order pending</span>
            </Link>
          )}
          {data.processingOrders > 0 && (
            <Link
              href="/admin/orders?status=PROCESSING"
              className="inline-flex items-center gap-2 h-8 px-3 bg-white border border-border rounded text-xs hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
              <span className="font-medium">{data.processingOrders}</span>
              <span className="text-muted">sedang diproses</span>
            </Link>
          )}
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 h-8 px-3 bg-white border border-border rounded text-xs text-muted hover:border-primary hover:text-primary transition-colors"
          >
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
              <path d="M7 2v10M2 7h10" strokeLinecap="round" />
            </svg>
            Produk baru
          </Link>
        </div>
      )}

      {/* Recent orders */}
      <RecentOrdersTable orders={data.orders} />
    </div>
  );
}
