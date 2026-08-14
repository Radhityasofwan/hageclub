"use client";

import Link from "next/link";
import { useCartStore } from "@/stores/cart-store";
import { CartItem } from "@/components/cart/cart-item";
import { CartSummary } from "@/components/cart/cart-summary";
import { CouponInput } from "@/components/cart/coupon-input";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { useI18n } from "@/lib/i18n/client";

export default function CartPage() {
  const { t } = useI18n();
  const { items, updateQuantity, removeItem, applyCoupon, removeCoupon, coupon, totalPrice } =
    useCartStore();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumb items={[{ label: t("nav.home"), href: "/" }, { label: t("cart.title") }]} className="mb-6" />
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="text-muted">
            <path d="M10 10h6l7 32h24l6-22H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="26" cy="54" r="3.5" stroke="currentColor" strokeWidth="2" />
            <circle cx="46" cy="54" r="3.5" stroke="currentColor" strokeWidth="2" />
          </svg>
          <div>
            <h1 className="text-xl font-semibold mb-2">{t("cart.empty")}</h1>
            <p className="text-sm text-muted mb-6">
              {t("cart.emptyMessage")}
            </p>
            <Link href="/shop">
              <Button variant="primary">{t("cart.shopNow")}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: t("nav.home"), href: "/" }, { label: t("cart.title") }]} className="mb-6" />

      <h1 className="text-2xl font-bold mb-8">{t("cart.title")}</h1>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Cart Items — 2/3 */}
        <div className="lg:w-2/3">
          <div className="divide-y divide-border">
            {items.map((item) => (
              <CartItem
                key={`${item.productId}-${item.variantId}`}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>

          {/* Coupon */}
          <CouponInput
            subtotal={totalPrice()}
            productIds={items.map((i) => i.productId)}
            onApply={applyCoupon}
            onRemove={removeCoupon}
            appliedCode={coupon?.code ?? null}
            className="mt-6"
          />

          {/* Update/clear */}
          <div className="flex gap-3 mt-4">
            <Link href="/shop">
              <Button variant="ghost" size="sm">
                {t("cart.continueShopping")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary — 1/3 */}
        <div className="lg:w-1/3">
          <CartSummary />
        </div>
      </div>
    </div>
  );
}
