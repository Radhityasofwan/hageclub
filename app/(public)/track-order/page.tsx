"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { useI18n } from "@/lib/i18n/client";
import { courierDisplayLabel } from "@/lib/rajaongkir-constants";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/checkout/order-status-badge";
import { OrderTimeline } from "@/components/checkout/order-timeline";
import type { OrderDetail } from "@/types/order";

export default function TrackOrderPage() {
  const { t, locale } = useI18n();
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState("");

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    if (!orderNumber.trim()) return;

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const res = await fetch(`/api/orders/${orderNumber.trim()}/status`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.message ?? t("trackOrder.notFound"));
        return;
      }
      setOrder(json.data ?? json);
    } catch {
      setError(t("toast.errorOccurred"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: t("nav.home"), href: "/" }, { label: t("trackOrder.title") }]} className="mb-6" />

      <h1 className="text-2xl font-bold mb-6">{t("trackOrder.title")}</h1>

      {/* Search form */}
      <form onSubmit={handleTrack} className="flex gap-3 mb-8">
        <div className="flex-1">
          <Input
            placeholder={t("trackOrder.orderIdPlaceholder")}
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
          />
        </div>
        <Button variant="primary" type="submit" disabled={loading || !orderNumber.trim()}>
          {loading ? t("trackOrder.tracking") : t("trackOrder.track")}
        </Button>
      </form>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-sm p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Order result */}
      {order && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="font-semibold">Order #{order.orderNumber}</h2>
              <p className="text-sm text-muted">{formatDateTime(order.createdAt)}</p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          {/* Items */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold tracking-widest uppercase text-muted">{t("trackOrder.product")}</h3>
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-muted">{t("trackOrder.qty")} {item.quantity} x {formatPrice(item.price, "IDR", locale)}</p>
                </div>
                <p className="font-medium">{formatPrice(item.subtotal, "IDR", locale)}</p>
              </div>
            ))}
          </div>

          {/* Price breakdown */}
          <div className="border-t border-border pt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">{t("cart.subtotal")}</span>
              <span>{formatPrice(order.subtotal, "IDR", locale)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-success">
                <span>{order.couponCode ? t("trackOrder.couponDiscount", { code: order.couponCode }) : t("trackOrder.discount")}</span>
                <span>-{formatPrice(order.discount, "IDR", locale)}</span>
              </div>
            )}
            <div className={`flex justify-between ${order.shippingCost === 0 ? "text-success" : ""}`}>
              <span className={order.shippingCost === 0 ? "" : "text-muted"}>
                {order.shippingCost === 0 && order.couponCode && order.discount === 0
                  ? t("trackOrder.couponFreeShipping", { code: order.couponCode })
                  : t("trackOrder.shipping")}
              </span>
              <span className={order.shippingCost === 0 ? "font-medium" : ""}>
                {order.shippingCost === 0 ? t("trackOrder.freeShipping") : formatPrice(order.shippingCost, "IDR", locale)}
              </span>
            </div>
            <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
              <span>{t("checkout.totalPayment")}</span>
              <span>{formatPrice(order.total, "IDR", locale)}</span>
            </div>
          </div>

          {/* Courier info */}
          {order.courier && (
            <div className="text-sm">
              <p className="text-muted">
                {t("trackOrder.courier")} {courierDisplayLabel(order.courier)} {order.courierService}
              </p>
              {order.trackingNumber && (
                <p className="text-muted">
                  {t("trackOrder.receipt")} <span className="font-mono">{order.trackingNumber}</span>
                </p>
              )}
            </div>
          )}

          <OrderTimeline entries={order.statusHistory} />

          {/* Shipping address */}
          <div className="border-t border-border pt-4 text-sm space-y-0.5">
            <h4 className="font-medium mb-1">{t("trackOrder.shippingAddress")}</h4>
            <p className="text-muted">{order.shippingAddress.recipientName}</p>
            <p className="text-muted">{order.shippingAddress.street}</p>
            <p className="text-muted">
              {order.shippingAddress.district}, {order.shippingAddress.city},{" "}
              {order.shippingAddress.province} {order.shippingAddress.postalCode}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
