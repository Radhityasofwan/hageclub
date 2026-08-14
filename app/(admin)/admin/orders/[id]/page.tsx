"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { DeliveryPanel } from "./delivery-panel";

interface OrderItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  subtotal: number;
  imageUrl: string | null;
  productId: string;
  variantId: string | null;
  product: { name: string; slug: string };
}

interface Payment {
  id: string;
  method: string;
  status: string;
  amount: number;
  transactionId: string | null;
  paymentUrl: string | null;
  vaNumber: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface StatusHistory {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
  createdBy: string | null;
}

interface ShippingAddress {
  recipientName: string;
  phone: string;
  street: string;
  district: string;
  city: string;
  province: string;
  postalCode: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  note: string | null;
  shippingAddress: unknown;
  courier: string | null;
  courierService: string | null;
  trackingNumber: string | null;
  deliveryOrderNo: string | null;
  deliveryStatus: string | null;
  deliveryLabelPath: string | null;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  customer: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  payment: Payment | null;
  statusHistory: StatusHistory[];
  user: { id: string; email: string; profile: { firstName: string; lastName: string; phone: string } | null } | null;
}

const STATUS_ACTIONS: Record<string, { next: string; label: string; variant: "primary" | "secondary" | "ghost" | "danger" }[]> = {
  PENDING: [
    { next: "PAID", label: "Mark as Paid", variant: "primary" },
    { next: "CANCELLED", label: "Cancel Order", variant: "danger" },
  ],
  PAID: [
    { next: "PROCESSING", label: "Start Processing", variant: "primary" },
    { next: "CANCELLED", label: "Cancel Order", variant: "danger" },
  ],
  PROCESSING: [
    { next: "PACKED", label: "Mark as Packed", variant: "secondary" },
    { next: "CANCELLED", label: "Cancel Order", variant: "danger" },
  ],
  PACKED: [
    { next: "SHIPPED", label: "Mark as Shipped", variant: "secondary" },
    { next: "CANCELLED", label: "Cancel Order", variant: "danger" },
  ],
  SHIPPED: [
    { next: "DELIVERED", label: "Mark as Delivered", variant: "secondary" },
  ],
  DELIVERED: [
    { next: "COMPLETED", label: "Complete Order", variant: "primary" },
  ],
};

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

export default function AdminOrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [savingTracking, setSavingTracking] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/orders/${params.id}`);
      const json = await res.json();
      if (json.success) {
        setOrder(json.data);
        setTrackingNumber(json.data.trackingNumber ?? "");
      } else {
        setError(json.message ?? "Order not found");
      }
    } catch {
      setError("Failed to load order");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  async function handleStatusUpdate(newStatus: string) {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/orders/${order!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          note: actionNote || undefined,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setConfirmAction(null);
        setActionNote("");
        fetchOrder();
      } else {
        alert(json.message ?? "Failed to update status");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleSaveTracking() {
    setSavingTracking(true);
    try {
      const res = await fetch(`/api/admin/orders/${order!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingNumber }),
      });
      if (res.ok) {
        fetchOrder();
      }
    } catch {
      // silent
    } finally {
      setSavingTracking(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-accent rounded w-48" />
          <div className="h-64 bg-accent rounded" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded px-5 py-8 text-center">
        <p className="text-sm text-destructive">{error ?? "Order not found"}</p>
        <a href="/admin/orders" className="text-sm text-primary hover:underline mt-2 inline-block">
          ← Back to Orders
        </a>
      </div>
    );
  }

  const shippingAddress = order.shippingAddress as ShippingAddress;

  const isTerminal = ["CANCELLED", "REFUNDED", "COMPLETED"].includes(order.status);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <a href="/admin/orders" className="text-xs text-muted hover:text-primary transition-colors">
        ← Back to Orders
      </a>

      {/* Order header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold font-mono">{order.orderNumber}</h1>
          <p className="text-sm text-muted mt-1">
            {formatDateTime(order.createdAt)} — {order.customer}
          </p>
        </div>
        <Badge variant={STATUS_VARIANTS[order.status] ?? "default"} size="md">
          {order.status}
        </Badge>
      </div>

      {/* Status actions */}
      {!isTerminal && STATUS_ACTIONS[order.status] && (
        <div className="bg-white border border-border rounded p-4">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Actions</h3>
          <div className="flex flex-wrap gap-2">
            {STATUS_ACTIONS[order.status].map((action) => (
              <Button
                key={action.next}
                variant={action.variant}
                size="sm"
                onClick={() => setConfirmAction(action.next)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order items */}
          <div className="bg-white border border-border rounded">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="text-sm font-semibold">Items ({order.items.length})</h3>
            </div>
            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="px-5 py-3 flex items-center gap-4">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="w-12 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-12 h-12 bg-accent rounded flex items-center justify-center">
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-muted">
                        <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted font-mono">{item.sku}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">{formatPrice(item.price)}</p>
                    <p className="text-xs text-muted">× {item.quantity}</p>
                  </div>
                  <div className="text-right text-sm font-medium w-20">
                    {formatPrice(item.subtotal)}
                  </div>
                </div>
              ))}
            </div>
            {/* Price summary */}
            <div className="px-5 py-3 border-t border-border space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted">Discount</span>
                  <span className="text-destructive">-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted">Shipping ({order.courier} {order.courierService})</span>
                <span>{formatPrice(order.shippingCost)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Status timeline */}
          <div className="bg-white border border-border rounded">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="text-sm font-semibold">Status History</h3>
            </div>
            <div className="px-5 py-4">
              <div className="space-y-0">
                {order.statusHistory.map((entry, idx) => (
                  <div key={entry.id ?? idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${
                        idx === order.statusHistory.length - 1
                          ? "bg-primary"
                          : "bg-border"
                      }`} />
                      {idx < order.statusHistory.length - 1 && (
                        <div className="w-px flex-1 bg-border" />
                      )}
                    </div>
                    <div className={`pb-4 ${idx === order.statusHistory.length - 1 ? "" : ""}`}>
                      <p className="text-sm font-medium">
                        <Badge variant={STATUS_VARIANTS[entry.status] ?? "default"} size="sm">
                          {entry.status}
                        </Badge>
                      </p>
                      {entry.note && (
                        <p className="text-xs text-muted mt-0.5">{entry.note}</p>
                      )}
                      <p className="text-[10px] text-muted mt-0.5">
                        {formatDateTime(entry.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Details */}
        <div className="space-y-6">
          {/* Customer info */}
          <div className="bg-white border border-border rounded">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="text-sm font-semibold">Customer</h3>
            </div>
            <div className="px-5 py-3 space-y-2 text-sm">
              <p className="font-medium">{order.customer}</p>
              {order.guestEmail && (
                <p className="text-xs text-muted">{order.guestEmail}</p>
              )}
              {order.guestPhone && (
                <p className="text-xs text-muted">{order.guestPhone}</p>
              )}
              {order.user && (
                <a href={`mailto:${order.user.email}`} className="text-xs text-primary hover:underline block">
                  {order.user.email}
                </a>
              )}
            </div>
          </div>

          {/* Shipping address */}
          <div className="bg-white border border-border rounded">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="text-sm font-semibold">Shipping Address</h3>
            </div>
            <div className="px-5 py-3 text-sm space-y-1">
              <p className="font-medium">{shippingAddress.recipientName}</p>
              <p className="text-xs text-muted">{shippingAddress.phone}</p>
              <p className="text-xs text-muted">{shippingAddress.street}</p>
              <p className="text-xs text-muted">
                {shippingAddress.district}, {shippingAddress.city}
              </p>
              <p className="text-xs text-muted">
                {shippingAddress.province} {shippingAddress.postalCode}
              </p>
            </div>
          </div>

          {/* Payment info */}
          <div className="bg-white border border-border rounded">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="text-sm font-semibold">Payment</h3>
            </div>
            <div className="px-5 py-3 space-y-2 text-sm">
              {order.payment ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted">Method</span>
                    <span className="font-medium uppercase">{order.payment.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Status</span>
                    <Badge variant={order.payment.status === "PAID" ? "success" : "default"} size="sm">
                      {order.payment.status}
                    </Badge>
                  </div>
                  {order.payment.transactionId && (
                    <div className="flex justify-between">
                      <span className="text-muted">Transaction</span>
                      <span className="text-xs font-mono">{order.payment.transactionId}</span>
                    </div>
                  )}
                  {order.payment.vaNumber && (
                    <div className="flex justify-between">
                      <span className="text-muted">VA Number</span>
                      <span className="font-mono text-xs">{order.payment.vaNumber}</span>
                    </div>
                  )}
                  {order.payment.paidAt && (
                    <div className="flex justify-between">
                      <span className="text-muted">Paid At</span>
                      <span className="text-xs">{formatDateTime(order.payment.paidAt)}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted">No payment record</p>
              )}
            </div>
          </div>

          {/* Pengiriman (Komship) */}
          {["PROCESSING", "PACKED", "SHIPPED", "DELIVERED"].includes(order.status) && (
            <DeliveryPanel
              order={{
                id: order.id,
                orderNumber: order.orderNumber,
                status: order.status,
                deliveryOrderNo: order.deliveryOrderNo,
                deliveryStatus: order.deliveryStatus,
                deliveryLabelPath: order.deliveryLabelPath,
                trackingNumber: order.trackingNumber,
              }}
              onChange={fetchOrder}
            />
          )}

          {/* Tracking */}
          {["PROCESSING", "PACKED", "SHIPPED", "DELIVERED"].includes(order.status) && (
            <div className="bg-white border border-border rounded">
              <div className="px-5 py-3 border-b border-border">
                <h3 className="text-sm font-semibold">Tracking</h3>
              </div>
              <div className="px-5 py-3 space-y-3">
                <Input
                  label="Tracking Number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number..."
                />
                <Button
                  variant="primary"
                  size="sm"
                  loading={savingTracking}
                  onClick={handleSaveTracking}
                  disabled={trackingNumber === (order.trackingNumber ?? "")}
                >
                  Save
                </Button>
              </div>
            </div>
          )}

          {/* Notes */}
          {order.note && (
            <div className="bg-white border border-border rounded">
              <div className="px-5 py-3 border-b border-border">
                <h3 className="text-sm font-semibold">Order Notes</h3>
              </div>
              <div className="px-5 py-3">
                <p className="text-sm text-muted">{order.note}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm status change modal */}
      <Modal
        isOpen={!!confirmAction}
        onClose={() => {
          setConfirmAction(null);
          setActionNote("");
        }}
        title={`Update Status to ${confirmAction}`}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Update order <strong>{order.orderNumber}</strong> from{" "}
            <Badge variant={STATUS_VARIANTS[order.status] ?? "default"} size="sm">
              {order.status}
            </Badge>{" "}
            to{" "}
            <Badge variant={STATUS_VARIANTS[confirmAction ?? ""] ?? "default"} size="sm">
              {confirmAction}
            </Badge>
          </p>
          <Input
            label="Note (optional)"
            value={actionNote}
            onChange={(e) => setActionNote(e.target.value)}
            placeholder="Reason for this update..."
          />
          {confirmAction === "CANCELLED" && (
            <p className="text-xs text-destructive">
              Cancelling will restore product stock to inventory.
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setConfirmAction(null);
                setActionNote("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant={confirmAction === "CANCELLED" ? "danger" : "primary"}
              loading={updatingStatus}
              onClick={() => confirmAction && handleStatusUpdate(confirmAction)}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
