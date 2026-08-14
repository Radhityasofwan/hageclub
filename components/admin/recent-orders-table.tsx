import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDateTime } from "@/lib/utils";

interface OrderItem {
  id: string;
  orderNumber: string;
  customer: string;
  status: string;
  total: number;
  paymentMethod: string | null;
  createdAt: Date;
}

interface RecentOrdersTableProps {
  orders: OrderItem[];
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

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  if (!orders.length) {
    return (
      <div className="bg-white border border-border rounded">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold">Recent Orders</h3>
        </div>
        <div className="px-5 py-8 text-center text-sm text-muted">
          No orders yet.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold">Recent Orders</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-accent/50">
              <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                Order
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                Customer
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                Payment
              </th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                Total
              </th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
              >
                <td className="px-5 py-3">
                  <a
                    href={`/admin/orders/${order.id}`}
                    className="text-primary font-medium hover:underline"
                  >
                    {order.orderNumber}
                  </a>
                </td>
                <td className="px-5 py-3 text-muted">{order.customer}</td>
                <td className="px-5 py-3">
                  <Badge variant={STATUS_VARIANTS[order.status] ?? "default"} size="sm">
                    {order.status}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-muted text-[11px] uppercase">
                  {order.paymentMethod ?? "—"}
                </td>
                <td className="px-5 py-3 text-right font-medium">
                  {formatPrice(order.total)}
                </td>
                <td className="px-5 py-3 text-right text-muted text-xs">
                  {formatDateTime(order.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
