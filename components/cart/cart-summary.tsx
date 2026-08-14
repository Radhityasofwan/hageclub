"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { useI18n } from "@/lib/i18n/client";
import { useStoreSettings } from "@/components/providers/store-settings-provider";
import { REGION_GROUPS } from "@/lib/regions";

interface CartSummaryProps {
  shippingEstimate?: number;
}

export function CartSummary({ shippingEstimate }: CartSummaryProps) {
  const router = useRouter();
  const { status } = useSession();
  const { t, locale } = useI18n();
  const { freeShippingThreshold: FREE_SHIPPING_THRESHOLD, freeShippingRegions } = useStoreSettings();
  const regionLabels = freeShippingRegions
    .map((k) => REGION_GROUPS.find((r) => r.key === k)?.label ?? k)
    .join(", ");
  const totalPrice = useCartStore((s) => s.totalPrice());
  const totalDiscount = useCartStore((s) => s.totalDiscount());
  const coupon = useCartStore((s) => s.coupon);
  const totalItems = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const shipping = coupon?.type === "FREE_SHIPPING" ? 0 : (shippingEstimate ?? 0);
  const remainingForFree = Math.max(0, FREE_SHIPPING_THRESHOLD - totalPrice);
  const qualifiesFreeShipping = totalPrice >= FREE_SHIPPING_THRESHOLD;
  const freeShippingProgress = Math.min(100, (totalPrice / FREE_SHIPPING_THRESHOLD) * 100);
  const grandTotal = totalPrice - totalDiscount + shipping;

  function handleCheckout() {
    if (status !== "authenticated") {
      router.push("/account");
      return;
    }
    router.push("/checkout");
  }

  return (
    <div className="bg-accent rounded-sm p-5 space-y-4">
      <h3 className="text-sm font-semibold tracking-widest uppercase">
        {t("cart.orderSummary")}
      </h3>

      {/* Free shipping progress */}
      {coupon?.type !== "FREE_SHIPPING" && (
        <div className="space-y-1.5">
          <div className="h-1 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
          {qualifiesFreeShipping ? (
            <p className="text-xs text-success font-medium">
              {t("cart.freeShippingQualified")}
            </p>
          ) : (
            <p className="text-xs text-muted">
              {t("cart.freeShippingProgress", {
                amount: formatPrice(remainingForFree, "IDR", locale),
              })}
            </p>
          )}
          {freeShippingRegions.length > 0 && (
            <p className="text-[10px] text-muted/70">
              {t("cart.freeShippingRegionHint", { regions: regionLabels })}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2 text-sm">
        <Row
          label={t("cart.subtotalItems", { count: totalItems })}
          value={formatPrice(totalPrice, "IDR", locale)}
        />
        {totalDiscount > 0 && (
          <Row
            label={t("checkout.discount")}
            value={`-${formatPrice(totalDiscount, "IDR", locale)}`}
            className="text-success"
          />
        )}
        {coupon?.type === "FREE_SHIPPING" && (
          <Row
            label={t("checkout.shipping")}
            value={t("cart.freeShippingFree")}
            className="text-success"
          />
        )}
        <div className="border-t border-border pt-2 flex justify-between font-semibold text-base">
          <span>{t("checkout.total")}</span>
          <span>{formatPrice(grandTotal, "IDR", locale)}</span>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={handleCheckout}
      >
        {status === "loading" ? t("common.loading") : t("cart.proceedToCheckout")}
      </Button>

      {status !== "authenticated" && (
        <p className="text-[10px] text-muted text-center">
          <Link href="/account" className="underline hover:text-primary">
            {t("cart.signInToCheckout")}
          </Link>
        </p>
      )}

      <p className="text-[10px] text-muted text-center">
        {t("cart.freeShippingHint", { amount: formatPrice(FREE_SHIPPING_THRESHOLD, "IDR", locale) })}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className={className}>{value}</span>
    </div>
  );
}
