"use client";

import { useRef, useState } from "react";
import { Image } from "@/components/ui/image";
import { ImageLightbox } from "./image-lightbox";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/client";
import type { ProductImage } from "@/types/product";

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const { t } = useI18n();
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef<number>(0);

  const sortedImages = [...images].sort((a, b) => {
    if (a.isCover && !b.isCover) return -1;
    if (!a.isCover && b.isCover) return 1;
    return a.sortOrder - b.sortOrder;
  });

  const activeImage = sortedImages[activeIndex];
  const hasMultiple = sortedImages.length > 1;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) < 50) return;
    if (diff > 0 && activeIndex < sortedImages.length - 1) {
      setActiveIndex((i) => i + 1);
    } else if (diff < 0 && activeIndex > 0) {
      setActiveIndex((i) => i - 1);
    }
  };

  function goPrev() {
    setActiveIndex((i) => Math.max(0, i - 1));
  }

  function goNext() {
    setActiveIndex((i) => Math.min(sortedImages.length - 1, i + 1));
  }

  if (!sortedImages.length) {
    return (
      <div className="aspect-[4/5] bg-accent rounded-sm flex items-center justify-center text-muted text-sm">
        {t("product.noImage")}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Main image */}
      <div
        className="group relative aspect-[4/5] max-h-[75vh] w-full overflow-hidden bg-accent rounded-sm select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Click-to-zoom overlay */}
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label={t("product.zoomImage")}
          className="absolute inset-0 z-10 cursor-zoom-in"
        />

        {activeImage && (
          <Image
            key={activeImage.id}
            src={activeImage.url}
            alt={activeImage.alt ?? productName}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        )}

        {/* Counter chip */}
        {hasMultiple && (
          <span className="absolute bottom-3 left-3 z-20 bg-black/50 backdrop-blur text-white text-[11px] font-medium px-2 py-0.5 rounded-full tabular-nums pointer-events-none">
            {activeIndex + 1} / {sortedImages.length}
          </span>
        )}

        {/* Prev / Next arrows */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              disabled={activeIndex === 0}
              aria-label={t("common.previous")}
              className={cn(
                "absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8",
                "bg-transparent text-primary/40 hover:text-primary/80 transition-colors",
                "flex items-center justify-center disabled:opacity-0",
                "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100"
              )}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M12.5 4.5L6 10l6.5 5.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={activeIndex === sortedImages.length - 1}
              aria-label={t("common.next")}
              className={cn(
                "absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8",
                "bg-transparent text-primary/40 hover:text-primary/80 transition-colors",
                "flex items-center justify-center disabled:opacity-0",
                "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100"
              )}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M7.5 4.5L14 10l-6.5 5.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </>
        )}

      </div>

      {/* Mobile nav dots — di bawah gambar, bukan di atasnya */}
      {hasMultiple && (
        <div className="flex justify-center gap-1.5 sm:hidden">
          {sortedImages.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`${productName} ${i + 1}`}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors",
                i === activeIndex ? "bg-primary" : "bg-neutral-400/50"
              )}
            />
          ))}
        </div>
      )}

      {/* Thumbnail strip — hidden on mobile */}
      {hasMultiple && (
        <div className="hidden sm:flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {sortedImages.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`${productName} ${i + 1}`}
              className={cn(
                "relative shrink-0 w-16 aspect-[4/5] rounded-sm overflow-hidden border-2 transition-colors",
                i === activeIndex ? "border-primary" : "border-transparent hover:border-border"
              )}
            >
              <Image
                src={img.url}
                alt={img.alt ?? `${productName} ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Zoom hint — desktop only */}
      {!hasMultiple && (
        <p className="hidden sm:flex items-center gap-1.5 text-xs text-muted">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="4.75" stroke="currentColor" strokeWidth="1.25" />
            <path d="M10.8 10.8L14.5 14.5M7 5v4M5 7h4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
          </svg>
          {t("product.zoomImage")}
        </p>
      )}

      {lightboxOpen && (
        <ImageLightbox
          images={sortedImages}
          index={activeIndex}
          productName={productName}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setActiveIndex}
        />
      )}
    </div>
  );
}
