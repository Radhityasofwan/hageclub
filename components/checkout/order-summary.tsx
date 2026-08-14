"use client";

import Image from "next/image";
import { cn, formatPrice } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { useI18n } from "@/lib/i18n/client";
import type { CouponType } from "@/types";

interface OrderSummaryProps {
  shippingCost: number;
  coupon?: { code: string; type: CouponType; discount: number } | null;
  freeShipping?: boolean;
  className?: string;
}

export function OrderSummary({ shippingCost, coupon, freeShipping = false, className }: OrderSummaryProps) {
  const { t } = useI18n();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.totalPrice());
  const discount = coupon?.discount ?? 0;
  const effectiveShipping = freeShipping ? 0 : shippingCost;
  const total = subtotal - discount + effectiveShipping;

  return (
    <div className={cn("bg-accent rounded-sm p-5 space-y-4", className)}>
      <h3 className="text-sm font-semibold tracking-widest uppercase">{t("checkout.orderSummary")}</h3>

      {/* Item list — cap height agar breakdown harga selalu terlihat di sidebar sticky */}
      <div className="space-y-3 max-h-[calc(100vh-24rem)] min-h-0 overflow-y-auto">
        {items.map((item) => (
          <div key={`${item.productId}-${item.variantId}`} className="flex gap-3">
            <div className="shrink-0 w-12 h-16 bg-white rounded overflow-hidden relative">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-muted">
                  Gbr
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="text-xs font-medium line-clamp-1">{item.name}</p>
              <p className="text-[11px] text-muted">{t("product.qty")}: {item.quantity}</p>
              <p className="text-xs font-semibold">{formatPrice(item.price * item.quantity)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Price breakdown */}
      <div className="space-y-2 text-sm border-t border-border pt-3">
        <Row label={t("cart.subtotal")} value={formatPrice(subtotal)} />
        {coupon && coupon.type !== "FREE_SHIPPING" && (
          <Row
            label={t("checkout.couponDiscount", { code: coupon.code })}
            value={`-${formatPrice(discount)}`}
            className="text-success"
          />
        )}
        <Row
          label={
            freeShipping && coupon?.type === "FREE_SHIPPING"
              ? t("checkout.couponFreeShipping", { code: coupon.code })
              : t("checkout.shipping")
          }
          value={freeShipping ? t("checkout.freeShipping") : shippingCost > 0 ? formatPrice(shippingCost) : "?"}
          className={freeShipping ? "text-success font-medium" : ""}
        />
        <div className="border-t border-border pt-2 flex justify-between font-semibold text-base">
          <span>{t("checkout.total")}</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className={className}>{value}</span>
    </div>
  );
}
