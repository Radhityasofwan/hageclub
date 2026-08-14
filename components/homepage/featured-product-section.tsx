"use client";

import Link from "next/link";
import { CountdownTimer } from "@/components/common/countdown-timer";
import { useI18n } from "@/lib/i18n/client";
import type { ProductCardData } from "@/types/product";

interface Props {
  title?: string | null;
  subtitle?: string | null;
  product: ProductCardData | null;
  showCountdown?: boolean;
  campaignTitle?: string;
  campaignEndDate?: string;
}

/**
 * Template "Featured Product (Full Screen)" untuk Section Product — header
 * (title/subtitle) terpisah di atas, lalu area full viewport berisi foto produk
 * dengan hanya countdown campaign dan CTA Shop Now.
 */
export function FeaturedProductSection({
  title,
  subtitle,
  product,
  showCountdown,
  campaignTitle,
  campaignEndDate,
}: Props) {
  const { t } = useI18n();

  const coverImage = product
    ? product.images.find((img) => img.isCover) ?? product.images[0]
    : null;

  const hasCountdown = Boolean(showCountdown && campaignEndDate);

  const productHref = product ? `/products/${product.slug}` : "/shop";
  const buttonLabel = product ? t("catalog.shopNow") : t("catalog.viewAllProducts");

  return (
    <section>
      {/* Header — terpisah dari gambar produk */}
      {(title || subtitle) && (
        <div className="py-14 sm:py-16 px-4 text-center">
          {title && (
            <p className="text-xs tracking-[0.3em] uppercase text-muted mb-3">
              {title}
            </p>
          )}
          {subtitle && (
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">
              {subtitle}
            </h2>
          )}
        </div>
      )}

      {/* Area full screen — foto produk sebagai visual utama.
          object-contain: seluruh gambar selalu terlihat tanpa terpotong di semua rasio
          layar (HP portrait/landscape, tablet, desktop); latar gradient mengisi sisa.
          min-h-svh: tinggi mengikuti viewport kecil (browser mobile) — fallback min-h-screen. */}
      <div
        id="product-collection"
        className="relative min-h-screen min-h-svh flex items-center justify-center overflow-hidden bg-gradient-to-b from-primary via-primary to-primary/95 scroll-mt-16"
      >
        {coverImage ? (
          <>
            {/* Satu gambar mengisi penuh seluruh layar (object-cover) — tanpa bar,
                tanpa background; sisi yang tidak muat ter-crop agar tetap penuh. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImage.url}
              alt={coverImage.alt || product?.name || ""}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_50%_50%,#ffffff_1px,transparent_1px)] bg-[length:24px_24px]" />
            <div className="absolute inset-0 bg-gradient-to-b from-primary via-primary to-primary/95" />
          </>
        )}

        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center py-24">
          {/* Countdown — promo terkait produk yang ditampilkan */}
          {hasCountdown && (
            <div className="inline-block border border-white/10 rounded px-8 py-5 backdrop-blur-sm">
              <CountdownTimer endDate={campaignEndDate!} title={campaignTitle ?? undefined} />
            </div>
          )}

          {/* CTA */}
          <div className="mt-10">
            <Link
              href={productHref}
              className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-semibold text-primary bg-white rounded-lg hover:bg-white/90 transition-colors sm:px-7 sm:py-3.5 sm:text-sm"
            >
              {buttonLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
