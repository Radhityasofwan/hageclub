import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDateTime } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

const STATUS_VARIANTS: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  PENDING: "default",
  PAID: "info",
  PROCESSING: "warning",
  PACKED: "info",
  SHIPPED: "info",
  DELIVERED: "success",
  COMPLETED: "success",
  CANCELLED: "danger",
  REFUNDED: "danger",
};

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const limit = 20;
  const skip = (page - 1) * limit;
  const status = params.status || "";
  const search = params.search || "";
  const dateFrom = params.dateFrom || "";
  const dateTo = params.dateTo || "";

  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (search) {
    where.OR = [
      { orderNumber: { contains: search } },
      { guestName: { contains: search } },
      { guestEmail: { contains: search } },
      { user: { email: { contains: search } } },
      { user: { profile: { firstName: { contains: search } } } },
      { user: { profile: { lastName: { contains: search } } } },
    ];
  }
  if (dateFrom || dateTo) {
    const createdAt: Record<string, Date> = {};
    if (dateFrom) createdAt.gte = new Date(dateFrom);
    if (dateTo) createdAt.lte = new Date(dateTo + "T23:59:59.999Z");
    where.createdAt = createdAt;
  }

  const [orders, total, statusCounts] = await Promise.all([
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
        items: { select: { quantity: true } },
      },
    }),
    db.order.count({ where: where as Prisma.OrderWhereInput }),
    // Counts for status filter chips
    db.order.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);
  const statusCountMap: Record<string, number> = {};
  for (const s of statusCounts) {
    statusCountMap[s.status] = s._count;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold">Orders</h1>
        <p className="text-sm text-muted">{total} total orders</p>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        <StatusChip label="All" href="/admin/orders" count={total} active={!status} />
        {["PENDING", "PAID", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELLED", "REFUNDED"].map((s) => (
          <StatusChip
            key={s}
            label={s}
            href={`/admin/orders?status=${s}`}
            count={statusCountMap[s] ?? 0}
            active={status === s}
          />
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-border rounded p-4">
        <form className="flex flex-wrap gap-3 items-end" method="GET">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Search</label>
            <input
              name="search"
              defaultValue={search}
              placeholder="Order #, name, email..."
              className="h-9 px-3 border border-border rounded text-sm w-56 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">From</label>
            <input
              name="dateFrom"
              type="date"
              defaultValue={dateFrom}
              className="h-9 px-3 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">To</label>
            <input
              name="dateTo"
              type="date"
              defaultValue={dateTo}
              className="h-9 px-3 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {status && <input type="hidden" name="status" value={status} />}
          <button
            type="submit"
            className="h-9 px-4 bg-accent rounded text-sm font-medium transition-colors hover:bg-accent/70"
          >
            Filter
          </button>
          {(search || dateFrom || dateTo) && (
            <Link
              href="/admin/orders"
              className="h-9 px-3 text-sm text-muted hover:text-primary flex items-center"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Order</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Customer</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Payment</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Shipping</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase">Total</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const customer =
                  order.guestName ??
                  (order.user?.profile
                    ? `${order.user.profile.firstName} ${order.user.profile.lastName}`.trim()
                    : order.user?.email ?? "Guest");
                return (
                  <tr
                    key={order.id}
                    className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium text-primary hover:underline font-mono text-xs"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted text-xs">{customer}</td>
                    <td className="px-5 py-3">
                      <Badge variant={STATUS_VARIANTS[order.status] ?? "default"} size="sm">
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-xs">
                      <span className="text-muted uppercase">{order.payment?.method ?? "—"}</span>
                      {order.payment && (
                        <Badge variant={order.payment.status === "PAID" ? "success" : "default"} size="sm" className="ml-1">
                          {order.payment.status}
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted">
                      {order.courier ? `${order.courier} ${order.courierService}` : "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-medium">{formatPrice(order.total)}</td>
                    <td className="px-5 py-3 text-right text-xs text-muted">
                      {formatDateTime(order.createdAt)}
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-muted">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-xs text-muted">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/orders?page=${page - 1}${status ? `&status=${status}` : ""}${search ? `&search=${search}` : ""}`}
                  className="h-8 px-3 border border-border rounded text-xs hover:bg-accent transition-colors flex items-center"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/orders?page=${page + 1}${status ? `&status=${status}` : ""}${search ? `&search=${search}` : ""}`}
                  className="h-8 px-3 border border-border rounded text-xs hover:bg-accent transition-colors flex items-center"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusChip({
  label,
  href,
  count,
  active,
}: {
  label: string;
  href: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
        active
          ? "bg-primary text-white border-primary"
          : "border-border text-muted hover:border-primary hover:text-primary"
      }`}
    >
      {label} ({count})
    </Link>
  );
}
