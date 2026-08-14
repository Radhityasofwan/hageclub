"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn, formatPrice } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/client";
import type { CartItem as CartItemType } from "@/types";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: string, variantId: string | null | undefined, quantity: number) => void;
  onRemove: (productId: string, variantId?: string | null) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  function handleQuantityChange(q: number) {
    setLoading(true);
    onUpdateQuantity(item.productId, item.variantId, q);
    // Brief visual feedback
    setTimeout(() => setLoading(false), 200);
  }

  return (
    <div
      className={cn(
        "flex gap-4 py-4 border-b border-border transition-opacity",
        loading && "opacity-50"
      )}
    >
      {/* Image */}
      <Link
        href={`/products/${item.slug ?? item.productId}`}
        className="shrink-0 w-20 h-24 bg-accent rounded overflow-hidden relative"
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-xs">
            {t("cart.noImage")}
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <Link
          href={`/products/${item.slug ?? item.productId}`}
          className="text-sm font-medium hover:underline line-clamp-1"
        >
          {item.name}
        </Link>
        {item.variantName && (
          <p className="text-xs text-muted">{item.variantName}</p>
        )}
        <p className="text-xs text-muted">{t("product.sku")}: {item.sku}</p>
        <p className="text-sm font-semibold">{formatPrice(item.price)}</p>
      </div>

      {/* Quantity + Price */}
      <div className="flex flex-col items-end justify-between shrink-0">
        {/* Quantity controls */}
        <div className="flex items-center border border-border rounded-sm">
          <button
            onClick={() => handleQuantityChange(item.quantity - 1)}
            disabled={item.quantity <= 1}
            className="w-7 h-7 flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-40"
            aria-label={t("common.decrease")}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <span className="w-8 text-center text-xs font-medium select-none">
            {item.quantity}
          </span>
          <button
            onClick={() => handleQuantityChange(item.quantity + 1)}
            disabled={item.quantity >= item.stock}
            className="w-7 h-7 flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-40"
            aria-label={t("common.increase")}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 2.5v7M2.5 6h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Subtotal */}
        <p className="text-sm font-semibold">
          {formatPrice(item.price * item.quantity)}
        </p>

        {/* Remove */}
        <button
          onClick={() => onRemove(item.productId, item.variantId)}
          className="text-xs text-muted hover:text-destructive transition-colors"
        >
          {t("cart.remove")}
        </button>
      </div>
    </div>
  );
}
