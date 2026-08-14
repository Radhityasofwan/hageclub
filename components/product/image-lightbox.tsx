"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Image } from "@/components/ui/image";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types/product";

interface ImageLightboxProps {
  images: ProductImage[];
  index: number;
  productName: string;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function ImageLightbox({
  images,
  index,
  productName,
  onClose,
  onNavigate,
}: ImageLightboxProps) {
  const { t } = useI18n();
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const image = images[index];
  const hasMultiple = images.length > 1;

  // Reset zoom when switching image
  useEffect(() => {
    setZoomed(false);
    setZoomPos({ x: 50, y: 50 });
  }, [index]);

  // Keyboard navigation + scroll lock
  useEffect(() => {
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (hasMultiple && e.key === "ArrowRight") {
        onNavigate(Math.min(images.length - 1, index + 1));
      }
      if (hasMultiple && e.key === "ArrowLeft") {
        onNavigate(Math.max(0, index - 1));
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [images.length, index, onClose, onNavigate, hasMultiple]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!zoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) });
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current || !hasMultiple) return;
    const dx = touchStart.current.x - e.changedTouches[0].clientX;
    const dy = touchStart.current.y - e.changedTouches[0].clientY;
    touchStart.current = null;
    if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;
    if (dx > 0) onNavigate(Math.min(images.length - 1, index + 1));
    else if (dx < 0) onNavigate(Math.max(0, index - 1));
  }

  if (!image) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label={productName}
    >
      {/* Top bar: counter + close */}
      <div className="flex items-center justify-between px-4 sm:px-6 h-14 shrink-0">
        <span className="text-sm text-white/70 tabular-nums">
          {index + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          aria-label={t("common.close")}
          className="w-10 h-10 flex items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white transition-colors"
        >
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M15 5L5 15M5 5L15 15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Stage */}
      <div
        className="relative flex-1 min-h-0 flex items-center justify-center px-4 sm:px-16 pb-4 select-none"
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={cn(
            "relative w-full h-full max-w-5xl",
            zoomed ? "cursor-zoom-out" : "cursor-zoom-in"
          )}
          onClick={() => setZoomed((z) => !z)}
        >
          <Image
            src={image.url}
            alt={image.alt ?? productName}
            fill
            className={cn(
              "object-contain transition-transform duration-200",
              zoomed && "scale-[1.75]"
            )}
            style={
              zoomed
                ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }
                : undefined
            }
            sizes="100vw"
          />
        </div>

        {/* Prev / Next */}
        {hasMultiple && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(Math.max(0, index - 1));
              }}
              aria-label={t("common.previous")}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M12.5 4.5L6 10l6.5 5.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(Math.min(images.length - 1, index + 1));
              }}
              aria-label={t("common.next")}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M7.5 4.5L14 10l-6.5 5.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Caption */}
      {image.alt && (
        <div className="shrink-0 pb-4 text-center text-sm text-white/60 px-4">
          {image.alt}
        </div>
      )}
    </div>,
    document.body
  );
}
