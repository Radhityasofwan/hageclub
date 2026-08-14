"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { useRecentlyViewed } from "@/components/product/recently-viewed";
import { formatPrice, cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/client";
import { useStoreSettings } from "@/components/providers/store-settings-provider";
import { REGION_GROUPS } from "@/lib/regions";
import type { ProductCardData } from "@/types/product";

export function MiniCart() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { freeShippingThreshold, freeShippingRegions } = useStoreSettings();
  const regionLabels = freeShippingRegions
    .map((k) => REGION_GROUPS.find((r) => r.key === k)?.label ?? k)
    .join(", ");
  const { data: session, status } = useSession();
  const { items, isOpen, closeCart, totalPrice, removeItem, updateQuantity } =
    useCartStore();
  const hydrateWishlist = useWishlistStore((s) => s.hydrate);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const { toast } = useToast();
  const { get: getRecent } = useRecentlyViewed();
  // Cart is persisted in localStorage; guard against SSR/hydration mismatch by
  // deferring any cart-state-dependent rendering until after mount.
  const [mounted, setMounted] = useState(false);
  const [recentProducts, setRecentProducts] = useState<ProductCardData[]>([]);

  useEffect(() => { setMounted(true); }, []);

  // Muat ulang "Baru Saja Dilihat" tiap drawer dibuka
  useEffect(() => {
    if (isOpen) setRecentProducts(getRecent());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (session?.user?.id) hydrateWishlist(session.user.id);
  }, [session?.user?.id, hydrateWishlist]);

  async function handleMoveToWishlist(
    productId: string,
    variantId: string | null | undefined
  ) {
    const res = await toggleWishlist(productId);
    if (!res.ok) {
      if (res.needsAuth) {
        router.push("/account");
        return;
      }
      toast(t("product.wishlistError"), { variant: "error" });
      return;
    }
    removeItem(productId, variantId);
    toast(t("product.savedToWishlist"), {
      variant: "info",
      action: { label: t("product.viewWishlist"), href: "/account?tab=wishlist" },
    });
  }

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeCart();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, closeCart]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  function handleCheckout() {
    closeCart();
    if (status !== "authenticated") {
      router.push("/account");
      return;
    }
    router.push("/checkout");
  }

  const hasItems = mounted && items.length > 0;

  return (
    <>
      {/* Backdrop — overlay gelap, halaman di belakang tetap terlihat */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={closeCart}
      />

      {/* Drawer — mobile: bottom sheet (88vh, rounded atas);
          sm+: side panel kanan (max 480px, full height). */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("cart.drawerTitle")}
        className={cn(
          "fixed z-50 bg-white shadow-xl flex flex-col",
          "sheet-transition",
          "max-sm:inset-x-0 max-sm:bottom-0 max-sm:h-[88vh] max-sm:rounded-t-[24px]",
          "sm:top-0 sm:right-0 sm:h-full sm:w-full sm:max-w-[480px]",
          isOpen
            ? "max-sm:translate-y-0 sm:translate-x-0"
            : "max-sm:translate-y-full sm:translate-x-full"
        )}
      >
        {/* Handle bar — mobile */}
        <div className="sm:hidden pt-2.5 pb-0.5 flex justify-center shrink-0">
          <div className="w-11 h-1.5 rounded-full bg-neutral-300" />
        </div>

        {/* Header — sticky */}
        <div className="flex items-center justify-between px-5 sm:px-6 h-14 sm:h-16 border-b border-border shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold">{t("cart.drawerTitle")}</h2>
          <button
            onClick={closeCart}
            className="w-10 h-10 flex items-center justify-center hover:bg-accent rounded transition-colors"
            aria-label={t("common.close")}
          >
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Konten — scrollable */}
        <div className="flex-1 overflow-y-auto">
          {!mounted || items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-5 px-6">
              <svg width="64" height="64" viewBox="0 0 48 48" fill="none" className="text-muted">
                <path d="M8 8h4l5.333 24H36l4-16H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="20" cy="40" r="2.5" stroke="currentColor" strokeWidth="2" />
                <circle cx="34" cy="40" r="2.5" stroke="currentColor" strokeWidth="2" />
              </svg>
              <p className="text-xl text-muted">{t("cart.emptyShort")}</p>
              <Button variant="secondary" size="lg" onClick={() => { closeCart(); router.push("/shop"); }}>
                {t("cart.shopNow")}
              </Button>
            </div>
          ) : (
            <>
              {/* Free shipping progress */}
              {(() => {
                const total = totalPrice();
                const progress = Math.min(100, (total / freeShippingThreshold) * 100);
                const qualified = total >= freeShippingThreshold;
                const remaining = formatPrice(freeShippingThreshold - total, "IDR", locale);
                return (
                  <div className="px-5 sm:px-6 pt-5 pb-2 space-y-2">
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className={`text-sm ${qualified ? "text-success font-medium" : "text-muted"}`}>
                      {qualified
                        ? t("cart.freeShippingQualified")
                        : t("cart.freeShippingProgress", { amount: remaining })}
                    </p>
                    {freeShippingRegions.length > 0 && (
                      <p className="text-xs text-muted/70">
                        {t("cart.freeShippingRegionHint", { regions: regionLabels })}
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Item list */}
              <div className="px-5 sm:px-6 py-2 space-y-0 divide-y divide-border">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex gap-4 py-5">
                    {/* Thumbnail — besar */}
                    <Link
                      href={`/products/${item.slug ?? item.productId}`}
                      className="shrink-0 w-28 h-36 sm:w-32 sm:h-40 bg-accent rounded-md overflow-hidden relative"
                      onClick={closeCart}
                    >
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="128px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted text-sm">
                          {t("cart.noImage")}
                        </div>
                      )}
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      {/* Baris 1: nama + aksi ikon (kanan atas, tidak melebar) */}
                      <div className="flex items-start gap-1.5">
                        <Link
                          href={`/products/${item.slug ?? item.productId}`}
                          className="flex-1 min-w-0 text-lg font-medium hover:underline line-clamp-1 pt-1.5"
                          onClick={closeCart}
                        >
                          {item.name}
                        </Link>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            onClick={() => handleMoveToWishlist(item.productId, item.variantId)}
                            className="w-9 h-9 flex items-center justify-center rounded text-muted hover:text-primary hover:bg-accent transition-colors"
                            aria-label={t("cart.moveToWishlist")}
                          >
                            <HeartIcon size={20} />
                          </button>
                          <button
                            onClick={() => removeItem(item.productId, item.variantId)}
                            className="w-9 h-9 flex items-center justify-center rounded text-muted hover:text-destructive hover:bg-accent transition-colors"
                            aria-label={t("cart.remove")}
                          >
                            <TrashIcon size={20} />
                          </button>
                        </div>
                      </div>

                      <p className="text-xl font-bold mt-1">{formatPrice(item.price)}</p>

                      {/* Badge stok — abu */}
                      <span className="inline-flex items-center px-3 py-2 rounded-md text-base font-medium leading-none mt-2 w-fit bg-accent text-muted">
                        {t("cart.stockInfo", { stock: item.stock })}
                      </span>

                      {/* Baris bawah: stepper + total baris */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-border rounded-md">
                          <button
                            onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="w-10 h-10 flex items-center justify-center hover:bg-accent disabled:opacity-40 rounded-l-md"
                            aria-label={t("common.decrease")}
                          >
                            <svg width="16" height="16" viewBox="0 0 10 10" fill="none">
                              <path d="M2 5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </button>
                          <span className="w-9 text-center text-lg font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                            className="w-10 h-10 flex items-center justify-center hover:bg-accent disabled:opacity-40 rounded-r-md"
                            aria-label={t("common.increase")}
                          >
                            <svg width="16" height="16" viewBox="0 0 10 10" fill="none">
                              <path d="M5 2v6M2 5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-base font-bold shrink-0">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-3 border-t border-border px-5 sm:px-6 py-5">
                <div className="flex items-center gap-2.5 text-sm sm:text-base text-muted">
                  <ShieldIcon size={20} />
                  {t("product.trustSecure")}
                </div>
                <div className="flex items-center gap-2.5 text-sm sm:text-base text-muted">
                  <LockIcon size={20} />
                  {t("cart.trustPrivacy")}
                </div>
              </div>

              {/* Baru Saja Dilihat — carousel sekunder, lebih kecil dari item */}
              {recentProducts.length > 0 && (
                <div className="border-t border-border px-5 sm:px-6 py-5">
                  <h3 className="text-xs font-semibold tracking-widest uppercase text-muted mb-3">
                    {t("cart.recentlyViewed")}
                  </h3>
                  <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
                    {recentProducts.slice(0, 6).map((p) => (
                      <div key={p.id} className="w-24 shrink-0">
                        <ProductCard product={p} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer — sticky */}
        {hasItems && (
          <div className="px-5 sm:px-6 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] border-t border-border space-y-3.5 shrink-0 bg-white">
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-medium text-muted">{t("cart.totalLabel")}</span>
              <span className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-foreground">
                {formatPrice(totalPrice())}
              </span>
            </div>
            <div className="space-y-2.5">
              <Button
                variant="secondary"
                size="lg"
                className="w-full h-12 rounded-lg"
                onClick={() => { closeCart(); router.push("/cart"); }}
              >
                {t("cart.viewCart")}
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="w-full h-14 text-lg rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
                onClick={handleCheckout}
              >
                {t("cart.checkout")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function HeartIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21C7.2 17.2 3.5 13.9 3.5 10.1 3.5 7.6 5.4 5.7 7.9 5.7c1.7 0 3.3.9 4.1 2.4.8-1.5 2.4-2.4 4.1-2.4 2.5 0 4.4 1.9 4.4 4.4 0 3.8-3.7 7.1-8.5 10.9Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3l7 3v5c0 4.4-3 8.4-7 10-4-1.6-7-5.6-7-10V6l7-3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
