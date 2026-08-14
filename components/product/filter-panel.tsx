"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/client";
import { FilterPanelContent, EMPTY_DRAFT } from "./product-filter";
import type { FilterDraft } from "./product-filter";
import type { CategoryWithChildren } from "@/types/product";

const DESKTOP_QUERY = "(min-width: 1024px)"; // breakpoint lg

function categoryFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/shop\/([^/]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

interface FilterTriggerProps {
  activeCount: number;
  categories: CategoryWithChildren[];
}

/**
 * Satu sistem filter dengan dua presentasi (dipilih otomatis oleh breakpoint lg):
 * HP → bottom sheet, Desktop → sidebar kiri.
 * Perubahan di-staging dulu; baru diterapkan ke product grid saat "Aplikasikan" diklik.
 */
export function FilterTrigger({ activeCount, categories }: FilterTriggerProps) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [draft, setDraft] = useState<FilterDraft>(EMPTY_DRAFT);

  // Deteksi breakpoint — presentasi ikut ukuran layar
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const update = () => {
      const matches = mq.matches;
      setIsDesktop(matches);
      if (!matches) setOpen(false);
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Desktop: sidebar tampil secara default. Sync draft dari URL hanya saat breakpoint
  // berubah (bukan saat URL berubah), supaya edit yang di-staging tidak hilang.
  useEffect(() => {
    if (isDesktop) {
      setOpen(true);
      setDraft(snapshotFromUrl());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop]);

  // Lock body scroll selama bottom sheet terbuka (mobile saja)
  useEffect(() => {
    if (open && !isDesktop) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open, isDesktop]);

  function snapshotFromUrl(): FilterDraft {
    const pathCat = categoryFromPath(pathname);
    return {
      sort: searchParams.get("sort") ?? "newest",
      category: searchParams.get("category") ?? pathCat,
      productType: searchParams.get("featured") === "true" ? "featured" : "all",
      inStock: searchParams.get("inStock") === "true",
      minPrice: searchParams.get("minPrice") ?? "",
      maxPrice: searchParams.get("maxPrice") ?? "",
      sizes: searchParams.getAll("size"),
    };
  }

  function handleToggle() {
    // Buka panel → ambil state filter terakhir dari URL (tutup tanpa apply = perubahan dibuang)
    if (!open) setDraft(snapshotFromUrl());
    setOpen(!open);
  }

  function handleClose() {
    setOpen(false);
  }

  function patch(patch: Partial<FilterDraft>) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  function handleClearAll() {
    setDraft({ ...EMPTY_DRAFT });
  }

  function handleApply() {
    const params = new URLSearchParams();
    if (draft.sort !== "newest") params.set("sort", draft.sort);

    let path = pathname;
    if (pathname === "/shop") {
      if (draft.category) params.set("category", draft.category);
    } else if (pathname.startsWith("/shop/")) {
      const pathCat = categoryFromPath(pathname);
      if (!draft.category) path = "/shop";
      else if (draft.category !== pathCat) path = `/shop/${draft.category}`;
    }

    if (draft.productType === "featured") params.set("featured", "true");
    if (draft.inStock) params.set("inStock", "true");
    const min = draft.minPrice.trim();
    const max = draft.maxPrice.trim();
    if (min) params.set("minPrice", min);
    if (max) params.set("maxPrice", max);
    draft.sizes.forEach((s) => params.append("size", s));

    const query = params.toString();
    router.push(query ? `${path}?${query}` : path, { scroll: false });

    // Draft mengikuti hasil apply (relevan saat pindah kategori dari panel)
    setDraft({ ...draft, minPrice: min, maxPrice: max });
    if (!isDesktop) setOpen(false);
  }

  return (
    <>
      {/* Tombol Filter (icon) */}
      <button
        onClick={handleToggle}
        aria-label={t("shop.filterProducts")}
        aria-expanded={open}
        className="relative flex items-center justify-center w-10 h-10 border border-border rounded-lg hover:border-primary text-primary transition-colors"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 7h9" />
          <path d="M17 7h3" />
          <circle cx="15.5" cy="7" r="1.5" />
          <path d="M4 12h3" />
          <path d="M11 12h9" />
          <circle cx="8.5" cy="12" r="1.5" />
          <path d="M4 17h9" />
          <path d="M17 17h3" />
          <circle cx="15.5" cy="17" r="1.5" />
        </svg>
        {activeCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center min-w-5 h-5 px-1 text-[10px] bg-primary text-white rounded-full">
            {activeCount}
          </span>
        )}
      </button>

      {/* MOBILE — Bottom Sheet */}
      <div
        className={cn("fixed inset-0 z-50 lg:hidden", !open && "pointer-events-none")}
        aria-hidden={!open}
      >
        {/* Backdrop */}
        <div
          className={cn(
            "absolute inset-0 bg-black/40 transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0"
          )}
          onClick={handleClose}
        />

        {/* Sheet */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("shop.filterAndSort")}
          className={cn(
            "absolute bottom-0 inset-x-0 bg-white rounded-t-3xl max-h-[85vh] flex flex-col transition-transform duration-300 ease-out",
            open ? "translate-y-0" : "translate-y-full"
          )}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 bg-border rounded-full" />
          </div>
          <FilterPanelContent
            categories={categories}
            draft={draft}
            onPatch={patch}
            onClearAll={handleClearAll}
            onApply={handleApply}
            onClose={handleClose}
            radioGroup="m"
          />
        </div>
      </div>

      {/* DESKTOP — Sidebar kiri (overlay; grid tetap terlihat di belakang) */}
      <div
        className={cn("fixed inset-0 z-50 hidden lg:block", !open && "pointer-events-none")}
        aria-hidden={!open}
      >
        {/* Backdrop */}
        <div
          className={cn(
            "absolute inset-0 bg-black/40 transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0"
          )}
          onClick={handleClose}
        />

        {/* Panel */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("shop.filterAndSort")}
          className={cn(
            "absolute top-0 bottom-0 left-0 w-80 max-w-[85vw] bg-white shadow-xl flex flex-col transition-transform duration-300 ease-out",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <FilterPanelContent
            categories={categories}
            draft={draft}
            onPatch={patch}
            onClearAll={handleClearAll}
            onApply={handleApply}
            onClose={handleClose}
            radioGroup="d"
          />
        </div>
      </div>
    </>
  );
}
