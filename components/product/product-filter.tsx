"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/client";
import type { CategoryWithChildren } from "@/types/product";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export interface FilterDraft {
  sort: string;
  category: string | null;
  productType: "all" | "featured";
  inStock: boolean;
  minPrice: string;
  maxPrice: string;
  sizes: string[];
}

export const EMPTY_DRAFT: FilterDraft = {
  sort: "newest",
  category: null,
  productType: "all",
  inStock: false,
  minPrice: "",
  maxPrice: "",
  sizes: [],
};

const SORT_KEYS: { value: string; labelKey: string }[] = [
  { value: "featured", labelKey: "shop.sortFeatured" },
  { value: "newest", labelKey: "shop.sortNewest" },
  { value: "oldest", labelKey: "shop.sortOldest" },
  { value: "best_selling", labelKey: "shop.sortPopular" },
  { value: "rating_desc", labelKey: "shop.sortRating" },
  { value: "price_asc", labelKey: "shop.sortPriceLow" },
  { value: "price_desc", labelKey: "shop.sortPriceHigh" },
  { value: "name_asc", labelKey: "shop.sortNameAZ" },
  { value: "name_desc", labelKey: "shop.sortNameZA" },
];

interface FilterPanelContentProps {
  categories: CategoryWithChildren[];
  draft: FilterDraft;
  onPatch: (patch: Partial<FilterDraft>) => void;
  onClearAll: () => void;
  onApply: () => void;
  onClose: () => void;
  /** Prefix nama radio — wajib berbeda per presentasi yang dirender bersamaan di DOM
   *  (bottom sheet + sidebar), kalau tidak radio group native saling menimpa checked. */
  radioGroup: string;
}

export function FilterPanelContent({
  categories,
  draft,
  onPatch,
  onClearAll,
  onApply,
  onClose,
  radioGroup,
}: FilterPanelContentProps) {
  const { t } = useI18n();

  const draftActiveCount =
    (draft.category ? 1 : 0) +
    (draft.productType === "featured" ? 1 : 0) +
    (draft.inStock ? 1 : 0) +
    (draft.minPrice.trim() || draft.maxPrice.trim() ? 1 : 0) +
    draft.sizes.length;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <h2 className="text-sm font-semibold">{t("shop.filterAndSort")}</h2>
        <button
          onClick={onClose}
          aria-label={t("shop.closeFilters")}
          className="text-primary hover:opacity-70 transition-opacity"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M15 5L5 15M5 5L15 15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="px-5 pb-5">
          {draftActiveCount > 0 && (
            <div className="flex justify-end pt-4">
              <button
                onClick={onClearAll}
                className="text-xs text-muted hover:text-primary transition-colors"
              >
                {t("shop.clearAll")}
              </button>
            </div>
          )}

          {/* Urutkan Berdasarkan */}
          <FilterSection title={t("shop.sortBy")} defaultOpen>
            <div className="space-y-2.5">
              {SORT_KEYS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="radio"
                    name={`${radioGroup}-sort`}
                    value={opt.value}
                    checked={draft.sort === opt.value}
                    onChange={() => onPatch({ sort: opt.value })}
                    className="accent-primary"
                  />
                  <span className="text-sm text-primary group-hover:opacity-70 transition-opacity">
                    {t(opt.labelKey)}
                  </span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Kategori */}
          {categories.length > 0 && (
            <FilterSection title={t("shop.category")} defaultOpen>
              <div className="space-y-2.5">
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="radio"
                      name={`${radioGroup}-category`}
                      value={cat.slug}
                      checked={draft.category === cat.slug}
                      onChange={() => onPatch({ category: cat.slug })}
                      className="accent-primary"
                    />
                    <span className="text-sm text-primary group-hover:opacity-70 transition-opacity">
                      {cat.name}
                    </span>
                  </label>
                ))}
              </div>
            </FilterSection>
          )}

          {/* Tipe Produk */}
          <FilterSection title={t("shop.productType")} defaultOpen>
            <div className="space-y-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  name={`${radioGroup}-productType`}
                  value="all"
                  checked={draft.productType === "all"}
                  onChange={() => onPatch({ productType: "all" })}
                  className="accent-primary"
                />
                <span className="text-sm text-primary group-hover:opacity-70 transition-opacity">
                  {t("shop.allProducts")}
                </span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  name={`${radioGroup}-productType`}
                  value="featured"
                  checked={draft.productType === "featured"}
                  onChange={() => onPatch({ productType: "featured" })}
                  className="accent-primary"
                />
                <span className="text-sm text-primary group-hover:opacity-70 transition-opacity">
                  {t("shop.featuredProducts")}
                </span>
              </label>
            </div>
          </FilterSection>

          {/* Ketersediaan */}
          <FilterSection title={t("shop.availability")} defaultOpen>
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={draft.inStock}
                onChange={() => onPatch({ inStock: !draft.inStock })}
                className="accent-primary"
              />
              <span className="text-sm text-primary group-hover:opacity-70 transition-opacity">
                {t("shop.inStockOnly")}
              </span>
            </label>
          </FilterSection>

          {/* Harga */}
          <FilterSection title={t("shop.priceRange")} defaultOpen>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder={t("shop.min")}
                value={draft.minPrice}
                onChange={(e) => onPatch({ minPrice: e.target.value })}
                className="w-full h-9 border border-border rounded-sm px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-muted text-xs shrink-0">–</span>
              <input
                type="number"
                placeholder={t("shop.max")}
                value={draft.maxPrice}
                onChange={(e) => onPatch({ maxPrice: e.target.value })}
                className="w-full h-9 border border-border rounded-sm px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            {(draft.minPrice.trim() || draft.maxPrice.trim()) && (
              <p className="text-xs text-muted mt-1">
                {draft.minPrice.trim() ? formatPrice(Number(draft.minPrice)) : "–"} &nbsp;{t("shop.to")}&nbsp;{" "}
                {draft.maxPrice.trim() ? formatPrice(Number(draft.maxPrice)) : "–"}
              </p>
            )}
          </FilterSection>

          {/* Size */}
          <FilterSection title={t("shop.size")} defaultOpen>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() =>
                    onPatch({
                      sizes: draft.sizes.includes(size)
                        ? draft.sizes.filter((s) => s !== size)
                        : [...draft.sizes, size],
                    })
                  }
                  className={cn(
                    "w-10 h-10 text-xs font-medium border rounded-sm transition-colors",
                    draft.sizes.includes(size)
                      ? "bg-primary text-white border-primary"
                      : "border-border text-primary hover:border-primary"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </FilterSection>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="px-5 py-4 border-t border-border shrink-0">
        <Button variant="primary" size="lg" className="w-full" onClick={onApply}>
          {t("shop.apply")}
        </Button>
      </div>
    </div>
  );
}

function FilterSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-border pt-4 mt-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-1 group"
        aria-expanded={open}
      >
        <h3 className="text-xs font-semibold tracking-widest uppercase text-muted">
          {title}
        </h3>
        <svg
          className={cn(
            "transition-transform duration-200 text-muted",
            open && "rotate-180"
          )}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && <div className="pt-2.5 pb-2">{children}</div>}
    </div>
  );
}
