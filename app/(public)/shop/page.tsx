import { Suspense } from "react";
import { getProducts, getCategories } from "@/lib/queries/product";
import { ProductGrid } from "@/components/product/product-grid";
import { FilterTrigger } from "@/components/product/filter-panel";
import { Pagination } from "@/components/product/pagination";
import { getI18n } from "@/lib/i18n/server";
import type { Metadata } from "next";
import type { ProductFilters } from "@/types/product";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Belanja",
  description: "Browse our complete collection of premium automotive lifestyle apparel.",
};

interface ShopPageProps {
  searchParams: {
    category?: string;
    sort?: string;
    page?: string;
    size?: string | string[];
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    featured?: string;
  };
}

function parseFilters(searchParams: ShopPageProps["searchParams"]): ProductFilters {
  return {
    category: searchParams.category,
    sort: searchParams.sort as ProductFilters["sort"],
    page: searchParams.page ? Number(searchParams.page) : 1,
    size: searchParams.size
      ? Array.isArray(searchParams.size)
        ? searchParams.size
        : [searchParams.size]
      : undefined,
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    inStock: searchParams.inStock === "true" ? true : undefined,
    featured: searchParams.featured === "true" ? true : undefined,
  };
}

function countActiveFilters(sp: ShopPageProps["searchParams"]): number {
  let n = 0;
  if (sp.category) n++;
  if (sp.minPrice || sp.maxPrice) n++;
  if (sp.inStock === "true") n++;
  if (sp.featured === "true") n++;
  const sizes = Array.isArray(sp.size) ? sp.size.length : sp.size ? 1 : 0;
  return n + sizes;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { t } = await getI18n();
  const filters = parseFilters(searchParams);
  const [result, categories] = await Promise.all([
    getProducts(filters),
    getCategories(),
  ]);

  const activeFilters = countActiveFilters(searchParams);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("shop.title")}</h1>
          <p className="text-sm text-muted mt-1">
            {t("shop.productsFound", { count: result.total })}
          </p>
        </div>
        <Suspense fallback={null}>
          <FilterTrigger activeCount={activeFilters} categories={categories} />
        </Suspense>
      </div>

      <div className="flex gap-8">
        {/* Filter: desktop → sidebar (di dalam FilterTrigger), mobile → bottom sheet */}

        {/* Products */}
        <div className="flex-1 min-w-0">
          {result.products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-lg font-medium text-primary">{t("shop.noProducts")}</p>
              <p className="text-sm text-muted mt-1">
                {t("shop.adjustFilters")}{" "}
                <a href="/shop" className="underline hover:opacity-70">
                  {t("shop.clearAllFilters")}
                </a>
              </p>
            </div>
          ) : (
            <ProductGrid products={result.products} />
          )}

          {result.totalPages > 1 && (
            <Suspense fallback={null}>
              <Pagination
                page={result.page}
                totalPages={result.totalPages}
                className="mt-12"
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
