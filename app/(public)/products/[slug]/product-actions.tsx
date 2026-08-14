"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { VariantSelector } from "@/components/product/variant-selector";
import { ShippingEstimator } from "@/components/product/shipping-estimator";
import { SizeGuide } from "@/components/product/size-guide";
import { WishlistButton } from "@/components/product/wishlist-button";
import { DescriptionViewMore } from "@/components/product/description-view-more";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/stores/cart-store";
import { useCartSheetStore } from "@/stores/cart-sheet-store";
import { useShippingModalStore } from "@/stores/shipping-modal-store";
import { useToast } from "@/components/ui/toast";
import { useRecentlyViewed } from "@/components/product/recently-viewed";
import { CouponListModal } from "@/components/product/coupon-list-modal";
import { AskProductSheet } from "@/components/product/ask-product-sheet";
import { useI18n } from "@/lib/i18n/client";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ProductDetail, ProductVariant } from "@/types/product";

interface ProductActionsProps {
  product: ProductDetail;
  sizeGuideImageUrl?: string | null;
  waNumber?: string | null;
  fullDescription?: string | null;
  couponCount?: number;
}

export function ProductActions({
  product,
  sizeGuideImageUrl,
  waNumber,
  fullDescription,
  couponCount = 0,
}: ProductActionsProps) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { status } = useSession();
  const { addItem, openCart, items: cartItems, isOpen: isCartOpen } = useCartStore();
  const openSheet = useCartSheetStore((s) => s.openSheet);
  const { toast } = useToast();
  const { add: addRecentlyViewed } = useRecentlyViewed();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [variantError, setVariantError] = useState("");
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [askModalOpen, setAskModalOpen] = useState(false);
  const shippingModalOpen = useShippingModalStore((s) => s.isOpen);
  const sizeSectionRef = useRef<HTMLDivElement>(null);

  const hasVariants = product.variants.length > 0;

  // Badge = jumlah produk unik di keranjang (baris line-item), bukan total quantity
  const cartCount = cartItems.length;

  useEffect(() => {
    addRecentlyViewed(product);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const effectiveStock = hasVariants ? (selectedVariant?.stock ?? 0) : product.stock;

  const effectivePrice =
    hasVariants && selectedVariant?.price != null
      ? selectedVariant.price
      : product.salePrice ?? product.price;

  const allVariantsOos = hasVariants && product.variants.every((v) => v.stock === 0);
  const isOutOfStock = hasVariants
    ? selectedVariant !== null
      ? selectedVariant.stock === 0
      : allVariantsOos
    : product.stock === 0;

  // Sudah di keranjang (per product + varian) → tidak bisa ditambah lagi
  const inCart = cartItems.some(
    (i) =>
      i.productId === product.id &&
      (i.variantId ?? null) === (selectedVariant?.id ?? null)
  );

  const isVariantPriceActive = hasVariants && selectedVariant?.price != null;
  const displaySalePrice = isVariantPriceActive ? null : product.salePrice;
  const displayOriginalPrice = displaySalePrice ? product.price : null;
  const discountPercent = displaySalePrice
    ? Math.round(((product.price - displaySalePrice) / product.price) * 100)
    : null;

  // Hanya atribut ukuran yang ditampilkan — arsitektur color per colorway sudah usang
  const selectedSizeLabel = selectedVariant
    ? Object.entries(selectedVariant.attributes)
        .filter(([key]) => key.toLowerCase() !== "color")
        .map(([, value]) => value)
        .join(" / ")
    : null;

  const handleVariantChange = useCallback((variant: ProductVariant | null) => {
    setSelectedVariant(variant);
    setVariantError("");
    setQuantity(1);
  }, []);

  function buildCartItem() {
    if (hasVariants && !selectedVariant) {
      setVariantError(t("product.selectAllOptions"));
      return null;
    }
    if (isOutOfStock) return null;

    const coverImage =
      product.images.find((img) => img.isCover)?.url ?? product.images[0]?.url ?? null;

    return {
      productId: product.id,
      slug: product.slug,
      variantId: selectedVariant?.id ?? null,
      name: product.name + (selectedVariant ? ` — ${selectedVariant.name}` : ""),
      price: effectivePrice,
      quantity,
      imageUrl: coverImage,
      sku: selectedVariant?.sku ?? product.sku,
      weight: product.weight,
      stock: effectiveStock,
    };
  }

  function doAddToCart() {
    const item = buildCartItem();
    if (!item) return;
    addItem(item);
    // Mobile: bottom sheet konfirmasi; desktop: toast + buka drawer
    if (window.matchMedia("(max-width: 1023px)").matches) {
      openSheet(item);
    } else {
      toast(t("toast.addedToCart"), { variant: "success" });
      openCart();
    }
  }

  function handleMissingSize() {
    toast(t("product.selectAllOptions"), { variant: "error" });
    setVariantError(t("product.selectAllOptions"));
    sizeSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function handleAddToCart() {
    if (inCart) {
      // Sudah di keranjang → buka drawer sebagai akses cepat "lihat keranjang"
      toast(t("product.alreadyInCart"), { variant: "warning" });
      openCart();
      return;
    }
    if (hasVariants && !selectedVariant) {
      handleMissingSize();
      return;
    }
    if (status !== "authenticated") {
      router.push("/account");
      return;
    }
    doAddToCart();
  }

  function handleBuyNow() {
    if (hasVariants && !selectedVariant) {
      handleMissingSize();
      return;
    }
    const item = buildCartItem();
    if (!item) return;
    if (status !== "authenticated") {
      router.push("/account");
      return;
    }
    addItem(item);
    router.push("/checkout");
  }

  // Sticky bar handlers — show toast on mobile when size not selected
  function handleAddToCartSticky() {
    if (inCart) {
      // Sudah di keranjang → buka drawer sebagai akses cepat ke keranjang
      toast(t("product.alreadyInCart"), { variant: "warning" });
      openCart();
      return;
    }
    if (hasVariants && !selectedVariant) {
      handleMissingSize();
      return;
    }
    handleAddToCart();
  }

  const waHref = waNumber
    ? `https://wa.me/${waNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(t("product.askProductMessage", { name: product.name }))}`
    : null;

  return (
    // pb-24 reserves space so floating sticky bar doesn't overlap last content on mobile
    <div className="pb-24 lg:pb-0">
      <div className="space-y-3 lg:space-y-4">

        {/* 2 — Harga + Wishlist */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span className="text-lg font-bold leading-none text-primary">
              {formatPrice(effectivePrice, "IDR", locale)}
            </span>
            {displayOriginalPrice && (
              <span className="text-sm text-muted line-through">
                {formatPrice(displayOriginalPrice, "IDR", locale)}
              </span>
            )}
            {discountPercent && (
              <Badge variant="danger" size="sm">
                {t("product.saveAmount", { percent: discountPercent })}
              </Badge>
            )}
          </div>
          <WishlistButton productId={product.id} size="md" />
        </div>

        {/* 3 — Info kupon (klik untuk lihat daftar) */}
        {couponCount > 0 && (
          <>
            <button
              type="button"
              onClick={() => setCouponModalOpen(true)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-accent/60 rounded-sm border border-border/60 hover:bg-accent transition-colors text-left group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-primary shrink-0">
                  <rect x="1.5" y="4.5" width="13" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M5.5 4.5v7M5.5 8h-.75a.75.75 0 1 1 0-1.5H5.5M5.5 8h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <span className="text-xs font-medium text-foreground">
                  {t("product.availableCoupons", { count: couponCount })}
                </span>
              </div>
              <span className="text-xs text-primary font-medium flex items-center gap-0.5 shrink-0 group-hover:underline">
                {t("product.viewCoupons")}
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M4.5 2.5L7.5 6L4.5 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
            <CouponListModal
              isOpen={couponModalOpen}
              onClose={() => setCouponModalOpen(false)}
            />
          </>
        )}

        {/* 4 — Informasi jumlah stok */}
        <div>
          {allVariantsOos ? (
            <Badge variant="default">{t("product.outOfStock")}</Badge>
          ) : hasVariants && !selectedVariant ? null : isOutOfStock ? (
            <Badge variant="default">{t("product.outOfStock")}</Badge>
          ) : effectiveStock <= 5 ? (
            <p className="text-xs text-warning font-medium">
              {t("product.lowStock", { stock: effectiveStock })}
            </p>
          ) : (
            <p className="text-xs text-muted">
              {t("product.inStock")} · {effectiveStock} {t("product.stockUnit")}
            </p>
          )}
        </div>

        {/* 5 — Pilih Ukuran + Panduan Ukuran + Variant buttons */}
        {hasVariants && (
          <div className="space-y-2.5" ref={sizeSectionRef}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                {t("product.chooseSize")}
                {selectedSizeLabel && (
                  <span className="ml-2 font-normal text-muted">{selectedSizeLabel}</span>
                )}
              </span>
              <SizeGuide imageUrl={sizeGuideImageUrl} />
            </div>
            <VariantSelector
              variants={product.variants}
              onChange={handleVariantChange}
              error={variantError}
              hideLabel
            />
          </div>
        )}

        {/* Quantity stepper */}
        {!allVariantsOos && !isOutOfStock && (!hasVariants || selectedVariant !== null) && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted">{t("product.qty")}</span>
            <div className="flex items-center border border-border rounded-sm">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-9 h-9 flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-40"
                aria-label={t("common.decrease")}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              <span className="w-10 text-center text-sm font-medium select-none">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(effectiveStock, Math.min(10, q + 1)))}
                disabled={quantity >= Math.min(effectiveStock, 10)}
                className="w-9 h-9 flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-40"
                aria-label={t("common.increase")}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* CTA desktop: Tambah Keranjang + Beli Sekarang side by side */}
        <div className="hidden lg:flex gap-3">
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            leadingIcon={
              <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M5.5 7.5h9l-.8 6.2a1.5 1.5 0 0 1-1.5 1.3H7.8a1.5 1.5 0 0 1-1.5-1.3l-.8-6.2ZM5.5 7.5l-.8-2H3M7.5 10.5v3M10.5 10.5v3M13.5 10.5v3"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          >
            {allVariantsOos
              ? t("product.outOfStock")
              : inCart
                ? t("product.inCart")
                : t("product.addToCart")}
          </Button>
          {!allVariantsOos && (
            <Button
              variant="secondary"
              size="lg"
              className="flex-1"
              onClick={handleBuyNow}
            >
              {t("product.buyNow")}
            </Button>
          )}
        </div>

        {/* 6 — Deskripsi panjang */}
        {fullDescription && (
          <div className="pt-1 border-t border-border">
            <DescriptionViewMore html={fullDescription} />
          </div>
        )}

        {/* 7 — Cek ongkir */}
        <ShippingEstimator weight={product.weight || 250} />

        {/* 8 — Kirim Pesan ke Hage Club — buka sheet tanya produk */}
        {waHref && (
          <button
            type="button"
            onClick={() => setAskModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-border rounded text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            <WaIcon size={16} />
            {t("product.askCta")}
          </button>
        )}
      </div>

      {/* ── Sticky Bottom Bar — mobile only, tiap elemen float sendiri.
          Sembunyi saat modal Cek Ongkir / sheet tanya produk / cart drawer
          terbuka agar tidak tumpang tindih. ── */}
      <div
        className={cn(
          "fixed bottom-4 left-4 right-4 z-50 lg:hidden flex items-center gap-2.5 transition-opacity duration-200",
          (shippingModalOpen || askModalOpen || isCartOpen) && "invisible opacity-0 pointer-events-none"
        )}
      >

        {/* 1. Tambah Keranjang — solid dark, selalu terlihat */}
        <button
          type="button"
          onClick={handleAddToCartSticky}
          disabled={isOutOfStock}
          className={cn(
            "flex-1 h-12 flex items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold",
            "shadow-[0_4px_20px_rgba(0,0,0,0.20)] transition-all active:scale-[0.97]",
            allVariantsOos
              ? "bg-neutral-300 text-neutral-500 cursor-not-allowed dark:bg-neutral-700 dark:text-neutral-400"
              : "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
          )}
        >
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M5.5 7.5h9l-.8 6.2a1.5 1.5 0 0 1-1.5 1.3H7.8a1.5 1.5 0 0 1-1.5-1.3l-.8-6.2ZM5.5 7.5l-.8-2H3M7.5 10.5v3M10.5 10.5v3M13.5 10.5v3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {allVariantsOos
            ? t("product.outOfStock")
            : inCart
              ? t("product.inCart")
              : t("product.addToCart")}
        </button>

        {/* 2. Icon Keranjang — panel semua produk di keranjang */}
        <button
          type="button"
          onClick={openCart}
          aria-label="Buka keranjang"
          className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-[0_4px_16px_rgba(0,0,0,0.10)] active:scale-95 transition-all shrink-0"
        >
          <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="text-neutral-800 dark:text-neutral-100">
            <path
              d="M5.5 7.5h9l-.8 6.2a1.5 1.5 0 0 1-1.5 1.3H7.8a1.5 1.5 0 0 1-1.5-1.3l-.8-6.2ZM5.5 7.5l-.8-2H3"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[10px] font-bold rounded-full flex items-center justify-center leading-none tabular-nums">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </button>

        {/* 3. Icon WA */}
        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("product.askProduct")}
            className="flex items-center justify-center w-12 h-12 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-[0_4px_16px_rgba(0,0,0,0.10)] text-neutral-800 dark:text-neutral-100 active:scale-95 transition-all shrink-0"
          >
            <WaIcon size={18} />
          </a>
        )}
      </div>

      {/* Sheet tanya produk via WA */}
      {waHref && (
        <AskProductSheet
          isOpen={askModalOpen}
          onClose={() => setAskModalOpen(false)}
          waNumber={waNumber}
        />
      )}
    </div>
  );
}

function WaIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
