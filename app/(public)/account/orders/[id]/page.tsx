import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrderById } from "@/lib/queries/order";
import { getI18n } from "@/lib/i18n/server";
import { courierDisplayLabel } from "@/lib/rajaongkir-constants";
import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import { OrderStatusBadge } from "@/components/checkout/order-status-badge";
import { OrderTimeline } from "@/components/checkout/order-timeline";
import { PendingPayment } from "@/components/account/pending-payment";
import { CancelOrderButton } from "@/components/account/cancel-order-button";
import { TRACKABLE_STATUSES } from "@/lib/order-status";
import { formatPrice, formatDateTime } from "@/lib/utils";
import Link from "next/link";

interface ShippingAddress {
  recipientName: string;
  phone: string;
  street: string;
  district: string;
  city: string;
  province: string;
  postalCode: string;
}

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const { t, locale } = await getI18n();
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  if (order.userId && order.userId !== session.user.id) redirect("/account/orders");

  const address = order.shippingAddress as unknown as ShippingAddress;
  const payment = order.payment;
  const payableAmount = payment?.finalAmount ?? order.total;

  const methodLabel = (m: string) =>
    m === "VA"
      ? t("payment.vaTitle")
      : m === "QRIS"
        ? t("payment.qrisTitle")
        : m === "EWALLET"
          ? t("payment.ewalletPayment")
          : m;

  const paymentStatusLabel = (s: string) =>
    s === "PENDING"
      ? t("payment.statusPending")
      : s === "PAID"
        ? t("payment.statusPaid")
        : s === "EXPIRED"
          ? t("payment.statusExpired")
          : s === "FAILED"
            ? t("payment.statusFailed")
            : s === "REFUNDED"
              ? t("payment.statusRefunded")
              : s;

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6 md:max-w-3xl md:py-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Link href="/account/orders" className="text-xs text-muted hover:text-primary mb-1 block">
            {t("account.backToOrders")}
          </Link>
          <h1 className="text-xl font-bold truncate">{t("account.orderNumberTitle", { number: order.orderNumber })}</h1>
          <p className="text-xs text-muted">{formatDateTime(order.createdAt, locale)}</p>
        </div>
        <OrderStatusBadge status={order.status} className="shrink-0" />
      </div>

      {/* Pembayaran belum lunas — lanjutkan pembayaran */}
      {order.status === "PENDING" && payment && payment.status !== "PAID" && (
        <PendingPayment
          orderId={order.id}
          payment={{
            method: payment.method,
            paymentToken: payment.paymentToken,
            paymentUrl: payment.paymentUrl,
            vaNumber: payment.vaNumber,
            vaBank: payment.vaBank,
            amount: payment.amount,
            finalAmount: payment.finalAmount,
            expiresAt: payment.expiresAt,
          }}
          accountName={address.recipientName}
        />
      )}

      {/* Items */}
      <div className="border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-semibold tracking-widest uppercase text-muted">{t("account.products")}</h3>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-3">
              <div className="shrink-0 w-14 h-20 bg-accent rounded-lg overflow-hidden relative">
                {item.imageUrl && (
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="56px" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight line-clamp-2">{item.name}</p>
                <p className="text-xs text-muted mt-1">SKU: {item.sku}</p>
                <p className="text-xs text-muted">{t("trackOrder.qty")} {item.quantity}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold">{formatPrice(item.subtotal, "IDR", locale)}</p>
                <p className="text-xs text-muted">{formatPrice(item.price, "IDR", locale)}/item</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price breakdown */}
      <div className="border border-border rounded-xl p-5 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">{t("account.subtotal")}</span>
          <span>{formatPrice(order.subtotal, "IDR", locale)}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between text-success">
            <span>{order.couponCode ? t("account.couponDiscount", { code: order.couponCode }) : t("account.discount")}</span>
            <span>-{formatPrice(order.discount, "IDR", locale)}</span>
          </div>
        )}
        <div className={`flex justify-between ${order.shippingCost === 0 ? "text-success" : ""}`}>
          <span className={order.shippingCost === 0 ? "" : "text-muted"}>
            {order.shippingCost === 0 && order.couponCode && order.discount === 0
              ? t("account.couponFreeShipping", { code: order.couponCode })
              : t("account.shipping")}
          </span>
          <span className={order.shippingCost === 0 ? "font-medium" : ""}>
            {order.shippingCost === 0 ? t("account.freeShipping") : formatPrice(order.shippingCost, "IDR", locale)}
          </span>
        </div>
        {payment?.finalAmount != null && payment.finalAmount > order.total && (
          <div className="flex justify-between text-muted">
            <span>{t("payment.feeIncluded", { fee: "" }).replace("{fee}", "")}</span>
            <span>+{formatPrice(payment.finalAmount - order.total, "IDR", locale)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
          <span>{t("account.total")}</span>
          <span>{formatPrice(payableAmount, "IDR", locale)}</span>
        </div>
      </div>

      {/* Shipping info */}
      <div className="border border-border rounded-xl p-5 text-sm">
        <h3 className="text-xs font-semibold tracking-widest uppercase text-muted mb-3">{t("trackOrder.shippingAddress")}</h3>
        <div className="space-y-1.5">
          <p className="font-medium">{address.recipientName}</p>
          <p className="text-muted">{address.phone}</p>
          <p className="text-muted leading-relaxed">{address.street}</p>
          <p className="text-muted leading-relaxed">
            {address.district}, {address.city}, {address.province} {address.postalCode}
          </p>
        </div>
        {(order.courier || order.trackingNumber) && (
          <div className="mt-3 pt-3 border-t border-border space-y-1.5">
            {order.courier && (
              <p className="text-xs text-muted">
                {t("trackOrder.courier")} <span className="text-foreground font-medium">{courierDisplayLabel(order.courier)} {order.courierService}</span>
              </p>
            )}
            {order.trackingNumber && (
              <p className="text-xs text-muted">
                {t("trackOrder.receipt")} <span className="font-mono text-foreground font-medium">{order.trackingNumber}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Payment info */}
      {payment && (
        <div className="border border-border rounded-xl p-5 space-y-2 text-sm">
          <h3 className="text-xs font-semibold tracking-widest uppercase text-muted mb-2">{t("account.paymentSection")}</h3>
          <div className="flex justify-between gap-3">
            <span className="text-muted shrink-0">{t("account.paymentMethod")}</span>
            <span className="text-right">{methodLabel(payment.method)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted shrink-0">{t("account.paymentStatus")}</span>
            <span className="text-right">{paymentStatusLabel(payment.status)}</span>
          </div>
          {payment.paidAt && (
            <div className="flex justify-between gap-3">
              <span className="text-muted shrink-0">{t("account.paidAt")}</span>
              <span className="text-right">{formatDateTime(payment.paidAt, locale)}</span>
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="border border-border rounded-xl p-5">
        <OrderTimeline entries={order.statusHistory} />
      </div>

      {/* Actions — lacak hanya untuk status yang sudah masuk alur pengiriman;
          batalkan hanya untuk order belum dibayar (PENDING) */}
      <div className="flex flex-wrap gap-2.5 pt-1">
        {TRACKABLE_STATUSES.includes(order.status) && (
          <Link
            href={`/track-order?order=${order.orderNumber}`}
            className="text-xs text-primary border border-border rounded-lg px-4 py-2.5 hover:bg-accent transition-colors"
          >
            {t("checkout.trackOrder")}
          </Link>
        )}
        {order.status === "PENDING" && <CancelOrderButton orderId={order.id} />}
      </div>
    </div>
  );
}
