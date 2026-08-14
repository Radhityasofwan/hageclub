"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ProductGrid } from "@/components/product/product-grid";
import { Image } from "@/components/ui/image";
import { CountdownTimer } from "@/components/common/countdown-timer";
import { useI18n } from "@/lib/i18n/client";
import type { ProductCardData } from "@/types/product";

export interface CategoryCardData {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  imageAlt: string;
}

interface Props {
  title: string;
  subtitle?: string | null;
  allProducts: ProductCardData[];
  categoryCards: CategoryCardData[];
  showSortDropdown: boolean;
  showViewAll: boolean;
  viewAllLink: string;
  viewAllText: string;
  showCountdown?: boolean;
  campaignTitle?: string;
  campaignEndDate?: string;
}

type TabSlug = "products" | "categories";

function sortProducts(products: ProductCardData[], sort: string): ProductCardData[] {
  const arr = [...products];
  switch (sort) {
    case "price_asc":
      return arr.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
    case "price_desc":
      return arr.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? b.price));
    case "newest":
      return arr.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case "featured":
      arr.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      break;
    default:
      break;
  }
  // Produk habis stok selalu turun ke posisi paling bawah; urutan dalam tiap grup tetap terjaga
  const inStock = arr.filter((p) => p.stock > 0);
  const outOfStock = arr.filter((p) => p.stock <= 0);
  return [...inStock, ...outOfStock];
}

export function CatalogClient({
  title,
  subtitle,
  allProducts,
  categoryCards,
  showSortDropdown,
  showViewAll,
  viewAllLink,
  viewAllText,
  showCountdown,
  campaignTitle,
  campaignEndDate,
}: Props) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabSlug>("products");
  const [sort, setSort] = useState("default");
  const [animating, setAnimating] = useState(false);

  const SORT_OPTIONS = [
    { value: "default", label: t("catalog.sortDefault"), disabled: true },
    { value: "featured", label: t("catalog.featured") },
    { value: "newest", label: t("catalog.newest") },
    { value: "price_asc", label: t("catalog.priceLow") },
    { value: "price_desc", label: t("catalog.priceHigh") },
  ];

  const TABS = [
    { slug: "products", label: t("catalog.allProducts") },
    { slug: "categories", label: t("catalog.categories") },
  ] as const;

  const products = useMemo(
    () => sortProducts(allProducts, sort),
    [allProducts, sort]
  );

  function handleTabChange(slug: TabSlug) {
    if (slug === activeTab) return;
    setAnimating(true);
    setTimeout(() => {
      setActiveTab(slug);
      setSort("default");
      setAnimating(false);
    }, 160);
  }

  const isProducts = activeTab === "products";

  return (
    <section
      id="product-collection"
      className="pt-10 pb-14 sm:pt-12 sm:pb-16 bg-white scroll-mt-28"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Countdown — di atas section title (template grid) */}
        {showCountdown && campaignEndDate && (
          <div className="mb-7">
            <CountdownTimer
              endDate={campaignEndDate}
              title={campaignTitle ?? undefined}
              variant="dark"
            />
          </div>
        )}

        {/* Heading */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-muted mt-1">{subtitle}</p>
          )}
        </div>

        {/* Tabs + Sort row */}
        <div className="relative flex items-center justify-center mb-8">
          {/* Tabs — centered */}
          <div className="flex items-center gap-8">
            {TABS.map((tab) => (
              <button
                key={tab.slug}
                onClick={() => handleTabChange(tab.slug)}
                className={`relative pb-2.5 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.slug
                    ? "text-primary"
                    : "text-muted/50 hover:text-muted"
                }`}
              >
                {tab.label}
                {activeTab === tab.slug && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[3px] bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Sort — HP: mengalir setelah tabs; desktop: absolute top-right */}
          {showSortDropdown && isProducts && (
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="ml-3 text-xs sm:ml-0 sm:text-[11px] tracking-wide border-b border-border pb-1 sm:pb-0.5 pr-5 bg-transparent text-muted hover:text-primary hover:border-primary transition-colors cursor-pointer outline-none appearance-none sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Cpath d='M2 3l4 2-4 2' fill='none' stroke='%23999' stroke-width='1'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 2px center",
              }}
              aria-label={t("catalog.sortDefault")}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Content — fade on switch */}
        <div
          className="transition-opacity duration-160"
          style={{ opacity: animating ? 0 : 1, transition: "opacity 0.16s ease" }}
        >
          {isProducts ? (
            /* ── Tab 1: All Products ── */
            products.length > 0 ? (
              <ProductGrid products={products} />
            ) : (
              <div className="text-center py-16">
                <p className="text-sm text-muted">{t("catalog.noProducts")}</p>
              </div>
            )
          ) : (
            /* ── Tab 2: Categories ── */
            categoryCards.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
                {categoryCards.map((cat) => (
                  <CategoryCard key={cat.id} category={cat} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-sm text-muted">{t("catalog.noCategories")}</p>
              </div>
            )
          )}
        </div>

        {/* View All — only on All Products tab */}
        {showViewAll && isProducts && (
          <div className="mt-10 text-center">
            <Link
              href={viewAllLink}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-primary border border-primary/25 rounded-lg hover:bg-primary/5 hover:border-primary/60 transition-colors sm:px-7 sm:py-3.5 sm:text-sm"
            >
              {viewAllText}
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M6 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Category Card ── */
function CategoryCard({ category }: { category: CategoryCardData }) {
  const { t } = useI18n();
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/shop/${category.slug}`}
      className="group block relative overflow-hidden rounded-sm bg-accent"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={`${category.name}`}
    >
      {/* Aspect ratio wrapper 3:4 */}
      <div className="aspect-[3/4]">
        {category.image ? (
          <Image
            src={category.image}
            alt={category.imageAlt}
            fill
            className="object-cover transition-transform duration-500 ease-out"
            style={{ transform: hovered ? "scale(1.06)" : "scale(1)" }}
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        ) : (
          /* Placeholder when no image */
          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
            <span className="text-xs text-muted">{category.name[0]}</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            background:
              "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.72) 100%)",
            opacity: hovered ? 1 : 0.85,
          }}
        />

        {/* Category name */}
        <div className="absolute bottom-0 left-0 right-0 p-3.5 sm:p-4">
          <p className="text-white font-semibold text-sm sm:text-base tracking-wide leading-tight">
            {category.name}
          </p>
          <p
            className="text-white/70 text-[11px] mt-0.5 flex items-center gap-1 transition-all duration-300"
            style={{
              opacity: hovered ? 1 : 0,
              transform: hovered ? "translateY(0)" : "translateY(4px)",
            }}
          >
            {t("catalog.viewCollection")}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </p>
        </div>
      </div>
    </Link>
  );
}
