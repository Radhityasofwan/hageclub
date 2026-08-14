"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCartSheetStore } from "@/stores/cart-sheet-store";
import { useCartStore } from "@/stores/cart-store";
import { useI18n } from "@/lib/i18n/client";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

const DRAG_THRESHOLD = 90;
const EXIT_MS = 350;

export function AddToCartSheet() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { status } = useSession();
  const { item, isOpen, closeSheet } = useCartSheetStore();
  const openCart = useCartStore((s) => s.openCart);
  const [leaving, setLeaving] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);

  const visible = isOpen || leaving;

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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

  function handleClose() {
    if (leaving) return;
    setLeaving(true);
    setTimeout(() => {
      closeSheet();
      setLeaving(false);
      setDragY(0);
    }, EXIT_MS);
  }

  function handleViewCart() {
    handleClose();
    openCart();
  }

  function handleBuyNow() {
    handleClose();
    if (status !== "authenticated") {
      router.push("/account");
      return;
    }
    router.push("/checkout");
  }

  // Swipe-to-dismiss: geser ke bawah dari handle → sheet menutup
  function onTouchStart(e: React.TouchEvent) {
    startY.current = e.touches[0].clientY;
    setDragging(true);
  }
  function onTouchMove(e: React.TouchEvent) {
    const delta = e.touches[0].clientY - startY.current;
    setDragY(Math.max(0, delta));
  }
  function onTouchEnd() {
    setDragging(false);
    if (dragY > DRAG_THRESHOLD) {
      handleClose();
    }
    setDragY(0);
  }

  if (!item || !visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 lg:hidden",
          isOpen && !leaving ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={handleClose}
      />

      {/* Bottom Sheet — mobile only */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("cart.sheetTitle")}
        className={cn(
          "fixed inset-x-0 bottom-0 z-[60] bg-white rounded-t-2xl shadow-2xl lg:hidden",
          "sheet-transition"
        )}
        style={{
          transform: isOpen && !leaving ? `translateY(${dragY}px)` : "translateY(100%)",
          transition: dragging ? "none" : undefined,
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-neutral-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2">
          <p className="text-sm font-semibold tracking-wide flex items-center gap-2 text-primary">
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M5.5 7.5h9l-.8 6.2a1.5 1.5 0 0 1-1.5 1.3H7.8a1.5 1.5 0 0 1-1.5-1.3l-.8-6.2Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="8" cy="16" r="1.2" fill="currentColor" />
              <circle cx="13" cy="16" r="1.2" fill="currentColor" />
            </svg>
            {t("cart.sheetTitle")}
          </p>
          <button
            onClick={handleClose}
            aria-label={t("common.close")}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Product info */}
        <div className="flex gap-3 px-5 py-4">
          <div className="shrink-0 w-16 h-20 bg-neutral-100 rounded-lg overflow-hidden relative">
            {item.imageUrl ? (
              <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="64px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400 text-[10px]">
                {t("cart.noImage")}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-sm font-medium line-clamp-2">{item.name}</p>
            <p className="text-xs text-neutral-500">
              {t("cart.sheetQty", { count: item.quantity })}
              {item.sku ? ` · ${item.sku}` : ""}
            </p>
            <p className="text-sm font-bold text-primary">
              {formatPrice(item.price, "IDR", locale)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-1 flex gap-2.5">
          <button
            onClick={handleViewCart}
            className="flex-1 h-12 rounded-xl border border-neutral-900 text-[13px] font-semibold text-neutral-900 hover:bg-neutral-100 active:scale-[0.98] transition-all"
          >
            {t("cart.viewCart")}
          </button>
          <button
            onClick={handleBuyNow}
            className="flex-1 h-12 rounded-xl bg-neutral-900 text-white text-[13px] font-semibold hover:bg-neutral-800 active:scale-[0.98] transition-all"
          >
            {t("product.buyNow")}
          </button>
        </div>
      </div>
    </>
  );
}
