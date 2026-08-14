"use client";

import Image from "next/image";
import Link from "next/link";
import { OrderStatusBadge } from "@/components/checkout/order-status-badge";
import { CancelOrderButton } from "@/components/account/cancel-order-button";
import { TRACKABLE_STATUSES } from "@/lib/order-status";
import { useI18n } from "@/lib/i18n/client";
import { formatPrice, formatDateTime } from "@/lib/utils";

export interface OrderCardOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string | Date;
  items: Array<{
    name: string;
    quantity: number;
    imageUrl?: string | null;
  }>;
}

interface OrderCardProps {
  order: OrderCardOrder;
}

export function OrderCard({ order }: OrderCardProps) {
  const { t, locale } = useI18n();
  const firstItem = order.items[0];
  const remainingCount = order.items.length - 1;
  const isPending = order.status === "PENDING";
  const canTrack = TRACKABLE_STATUSES.includes(order.status);

  return (
    <div className="border border-border rounded-xl p-4 sm:p-5 space-y-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">#{order.orderNumber}</p>
          <p className="text-xs text-muted mt-0.5">{formatDateTime(order.createdAt, locale)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="flex items-center gap-3 text-sm">
        {firstItem?.imageUrl && (
          <div className="hidden md:block shrink-0 w-12 h-12 rounded-lg bg-accent overflow-hidden relative">
            <Image src={firstItem.imageUrl} alt={firstItem.name} fill className="object-cover" sizes="48px" />
          </div>
        )}
        {firstItem && (
          <span className="text-muted truncate flex-1">
            {firstItem.name}
            {remainingCount > 0 && (
              <>
                {" "}{t("account.moreItems", { count: remainingCount })}
              </>
            )}
          </span>
        )}
        <span className="font-semibold shrink-0">{formatPrice(order.total, "IDR", locale)}</span>
      </div>

      <div className="flex items-center gap-2.5 pt-2.5 border-t border-border flex-wrap">
        {isPending && (
          <Link
            href={`/account/orders/${order.id}`}
            className="text-xs font-medium text-white bg-primary rounded-lg px-3.5 py-2 hover:bg-primary/90 transition-colors"
          >
            {t("account.payNow")}
          </Link>
        )}
        <Link
          href={`/account/orders/${order.id}`}
          className="text-xs text-primary hover:underline font-medium py-1"
        >
          {t("account.viewDetail")}
        </Link>
        {canTrack && (
          <Link
            href={`/track-order?order=${order.orderNumber}`}
            className="text-xs text-muted hover:text-primary hover:underline py-1"
          >
            {t("checkout.trackOrder")}
          </Link>
        )}
        {isPending && <CancelOrderButton orderId={order.id} compact />}
      </div>
    </div>
  );
}
