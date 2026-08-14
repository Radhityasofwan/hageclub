"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Image } from "@/components/ui/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartStore } from "@/stores/cart-store";
import { useCartSheetStore } from "@/stores/cart-sheet-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n/client";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ProductCardData } from "@/types/product";

interface ProductCardProps {
  product: ProductCardData;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { data: session, status } = useSession();
  const wishlistIds = useWishlistStore((s) => s.ids);
  const hydrate = useWishlistStore((s) => s.hydrate);
  const resetWishlist = useWishlistStore((s) => s.reset);
  const toggleWishlistApi = useWishlistStore((s) => s.toggle);
  const [saving, setSaving] = useState(false);
  const { addItem, openCart } = useCartStore();
  const openSheet = useCartSheetStore((s) => s.openSheet);
  const { toast } = useToast();

  const wishlisted = wishlistIds.includes(product.id);

  const coverImage = product.images.find((img) => img.isCover) ?? product.images[0];
  const secondImage = product.images.find((img) => !img.isCover && img !== coverImage);

  useEffect(() => {
    if (session?.user?.id) {
      hydrate(session.user.id);
    } else {
      resetWishlist();
    }
  }, [session?.user?.id, hydrate, resetWishlist]);

  const isOutOfStock = product.stock === 0;
  const onSale = product.salePrice !== null && product.salePrice < product.price;
  const hasVariants = product.hasVariants ?? false;
  const isLowStock = !isOutOfStock && product.stock <= 5;
  const isNewProduct = product.isNew;

  // Produk sudah di keranjang → quick add tidak bisa lagi
  const cartItems = useCartStore((s) => s.items);
  const inCart = cartItems.some((i) => i.productId === product.id);

  function doQuickAdd() {
    const item = {
      productId: product.id,
      slug: product.slug,
      variantId: null,
      name: product.name,
      price: product.salePrice ?? product.price,
      quantity: 1,
      imageUrl: coverImage?.url ?? null,
      sku: product.sku,
      weight: 0,
      stock: product.stock,
    };
    addItem(item);
    // Mobile: bottom sheet konfirmasi; desktop: toast + buka drawer
    if (window.matchMedia("(max-width: 1023px)").matches) {
      openSheet(item);
    } else {
      toast(t("product.addedToCart"), { variant: "success" });
      openCart();
    }
  }

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (isOutOfStock) return;
    if (!session?.user) {
      router.push("/account");
      return;
    }
    doQuickAdd();
  }

  async function doToggleWishlist() {
    const result = await toggleWishlistApi(product.id);
    if (!result.ok) {
      if (result.needsAuth) {
        router.push("/account");
        return;
      }
      toast(t("product.wishlistError"), { variant: "error" });
      return;
    }
    toast(
      result.added ? t("product.savedToWishlist") : t("product.removedFromWishlist"),
      {
        variant: "info",
        ...(result.added && { action: { label: t("product.viewWishlist"), href: "/account?tab=wishlist" } }),
      }
    );
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    if (status === "loading" || saving) return;
    if (!session?.user) {
      router.push("/account");
      return;
    }
    setSaving(true);
    doToggleWishlist().finally(() => setSaving(false));
  }

  return (
    <article className={cn("group relative", className)}>
      <Link href={`/products/${product.slug}`} className="block">
        {/* Image container — 3:4 portrait */}
        <div
          className={cn(
            "relative aspect-[3/4] overflow-hidden bg-accent rounded-sm",
            isOutOfStock && "opacity-60 saturate-0"
          )}
        >
          {/* Primary image */}
          {coverImage && (
            <Image
              src={coverImage.url}
              alt={coverImage.alt ?? product.name}
              fill
              className={cn(
                "object-cover transition-opacity duration-500",
                secondImage ? "group-hover:opacity-0" : ""
              )}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          )}

          {/* Secondary image on hover */}
          {secondImage && (
            <Image
              src={secondImage.url}
              alt={secondImage.alt ?? product.name}
              fill
              className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isOutOfStock ? (
              <Badge variant="default">{t("product.outOfStock")}</Badge>
            ) : (
              <>
                {onSale && <Badge variant="danger">{t("product.onSale")}</Badge>}
                {isNewProduct && <Badge variant="info">{t("product.new")}</Badge>}
                {isLowStock && !onSale && !isNewProduct && (
                  <Badge variant="warning">{t("product.lowStock", { stock: product.stock })}</Badge>
                )}
              </>
            )}
          </div>

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            aria-pressed={wishlisted}
            aria-label={wishlisted ? t("product.removeFromWishlist") : t("product.addToWishlist")}
            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white/90 rounded-sm hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill={wishlisted ? "#1C1C1E" : "none"}
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 14S2 10 2 6C2 4 3.5 3 5.5 3c1 0 1.9.5 2.5 1.2C8.6 3.5 9.5 3 10.5 3c2 0 3.5 1 3.5 3C14 10 8 14 8 14Z"
                stroke="#1C1C1E"
                strokeWidth="1.25"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Quick Add — only for products without variants */}
          {!hasVariants && !isOutOfStock && (
            <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
              <Button
                variant="primary"
                className="w-full rounded-none rounded-b-sm text-xs h-9"
                onClick={handleQuickAdd}
                disabled={inCart}
              >
                {inCart ? t("product.inCart") : t("product.quickAdd")}
              </Button>
            </div>
          )}

          {/* View Options — for variant products */}
          {hasVariants && !isOutOfStock && (
            <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
              <div className="w-full bg-primary text-white text-xs h-9 flex items-center justify-center gap-1.5 font-medium rounded-b-sm">
                {t("product.viewOptions")}
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M5 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="mt-3 space-y-1">
          <p className="text-xs text-muted tracking-wide">{product.category.name}</p>
          <h3 className="text-sm font-medium text-primary line-clamp-2 leading-snug">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            {onSale ? (
              <>
                <span className="text-sm font-semibold text-destructive">
                  {formatPrice(product.salePrice!, "IDR", locale)}
                </span>
                <span className="text-xs text-muted line-through">
                  {formatPrice(product.price, "IDR", locale)}
                </span>
              </>
            ) : (
              <span className="text-sm font-semibold text-primary">
                {formatPrice(product.price, "IDR", locale)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("", className)}>
      <Skeleton variant="block" className="aspect-[3/4] w-full" />
      <div className="mt-3 space-y-2">
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="30%" />
      </div>
    </div>
  );
}
