"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/client";

export interface HeroContent {
  bgImage?: string;
  /** Gambar slider (lebih dari 1 = auto-fade). Dipakai dulu daripada bgImage. */
  bgImages?: { url: string }[];
  bgType?: "image" | "gradient" | "solid";
  showCtaPrimary?: boolean;
  ctaText?: string;
  ctaLink?: string;
  showCtaSecondary?: boolean;
  ctaSecondaryText?: string;
  ctaSecondaryLink?: string;
}

interface Props {
  title?: string | null;
  subtitle?: string | null;
  content: HeroContent | null;
}

const SLIDE_INTERVAL_MS = 5000;

export function HeroSection({ title, subtitle, content }: Props) {
  const { t } = useI18n();
  const c = content ?? {};

  // Slider = bgImages (array) + bgImage lama ikut digabung (dedupe) sebagai slide
  // tambahan — jadi menambahkan 1 gambar saja sudah langsung menjadi slider 2 slide.
  const images = (() => {
    const list: string[] = [];
    for (const img of c.bgImages ?? []) {
      if (img.url && !list.includes(img.url)) list.push(img.url);
    }
    if (c.bgImage && !list.includes(c.bgImage)) list.push(c.bgImage);
    return list;
  })();

  const [activeIndex, setActiveIndex] = useState(0);
  // Naik setiap navigasi manual agar timer auto-slide di-reset
  const [navKey, setNavKey] = useState(0);

  const hasSlider = images.length > 1;

  // Auto-slide (crossfade) hanya jika ada lebih dari satu gambar
  useEffect(() => {
    if (!hasSlider) return;
    const timer = setInterval(() => {
      setActiveIndex((i) => (i + 1) % images.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [hasSlider, images.length, navKey]);

  const currentIndex = images.length > 0 ? activeIndex % images.length : 0;

  function goToSlide(i: number) {
    setActiveIndex(((i % images.length) + images.length) % images.length);
    setNavKey((k) => k + 1);
  }

  function scrollToProducts(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    const target = document.getElementById("product-collection");
    if (!target) return;
    // Header fixed — offset mengikuti tinggi header aktual (termasuk announcement bar
    // yang mendorong header turun) agar judul section tidak tertutup navbar.
    const header = document.querySelector("header");
    const rect = header?.getBoundingClientRect();
    const offset = rect ? rect.top + rect.height : 64;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  return (
    <section className="relative min-h-screen min-h-svh flex items-center justify-center overflow-hidden">
      {/* Background — slider gambar; judul sengaja opacity rendah agar visual tetap fokus */}
      {images.length > 0 ? (
        <>
          {images.map((src, i) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={`${src}-${i}`}
              src={src}
              alt=""
              width={1920}
              height={1080}
              aria-hidden={i !== currentIndex}
              fetchPriority={i === 0 ? "high" : "low"}
              loading={i === 0 ? "eager" : "lazy"}
              decoding={i === 0 ? "sync" : "async"}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                i === currentIndex ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-black/60" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_50%_50%,#ffffff_1px,transparent_1px)] bg-[length:24px_24px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary via-primary to-primary/95" />
        </>
      )}

      <div className="relative z-10 max-w-3xl mx-auto px-8 sm:px-4 text-center">
        {title && (
          <p className="text-xs tracking-[0.3em] uppercase text-white/30 mb-6">
            {title}
          </p>
        )}
        {subtitle ? (
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white/50">
            {subtitle}
          </h1>
        ) : (
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white/50">
            HAGE CLUB
          </h1>
        )}

        {/* CTA Buttons — minimalis: HP membungkus teks (tidak full-width agar
            tidak menutupi visual), desktop lebih lega */}
        {(c.showCtaPrimary || c.showCtaSecondary) && (
          <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {c.showCtaPrimary && (
              <a
                href="#product-collection"
                onClick={scrollToProducts}
                className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-semibold text-primary bg-white rounded-lg hover:bg-white/90 transition-colors sm:px-7 sm:py-3.5 sm:text-sm"
              >
                {/* Teks tombol dinamis dari admin; fallback ke i18n bila kosong */}
                {c.ctaText || t("hero.viewMore")}
              </a>
            )}
            {c.showCtaSecondary && c.ctaSecondaryText && c.ctaSecondaryLink && (
              <a
                href={c.ctaSecondaryLink}
                className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-semibold text-white border border-white/40 rounded-lg hover:bg-white/10 transition-colors sm:px-7 sm:py-3.5 sm:text-sm"
              >
                {c.ctaSecondaryText}
              </a>
            )}
          </div>
        )}
      </div>

      {/* Navigasi slider — HP: pojok bawah (tidak menabrak teks); sm+: tengah vertikal */}
      {hasSlider && (
        <>
          <button
            type="button"
            onClick={() => goToSlide(currentIndex - 1)}
            aria-label={t("hero.prevSlide")}
            className="absolute top-1/2 -translate-y-1/2 left-3 sm:left-8 z-10 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M11 3.5 5.5 9l5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => goToSlide(currentIndex + 1)}
            aria-label={t("hero.nextSlide")}
            className="absolute top-1/2 -translate-y-1/2 right-3 sm:right-8 z-10 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M7 3.5 12.5 9 7 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20">
        <span className="text-[10px] tracking-[0.2em] uppercase">{t("hero.scroll")}</span>
        <svg width="16" height="24" viewBox="0 0 16 24" fill="none" className="animate-bounce">
          <rect x="1.5" y="1.5" width="13" height="21" rx="6.5" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="8" cy="9" r="1.5" fill="currentColor" />
        </svg>
      </div>
    </section>
  );
}
