import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { getProducts, getCategories, getCategoryBySlug } from "@/lib/queries/product";
import { ProductGrid } from "@/components/product/product-grid";
import { FilterTrigger } from "@/components/product/filter-panel";
import { Pagination } from "@/components/product/pagination";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Image } from "@/components/ui/image";
import type { ProductFilters } from "@/types/product";

interface CategoryPageProps {
  params: { category: string };
  searchParams: {
    sort?: string;
    page?: string;
    size?: string | string[];
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    featured?: string;
  };
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const category = await getCategoryBySlug(params.category);
  if (!category) return {};
  return {
    title: category.seoTitle ?? category.name,
    description:
      category.seoDescription ??
      `Shop ${category.name} collection from HAGE CLUB.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { t } = await getI18n();
  const [category, categories] = await Promise.all([
    getCategoryBySlug(params.category),
    getCategories(),
  ]);

  if (!category) notFound();

  const filters: ProductFilters = {
    category: params.category,
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

  const result = await getProducts(filters);

  const activeFilters = Object.entries(searchParams).filter(
    ([k, v]) => v && k !== "sort" && k !== "page"
  ).length;

  return (
    <div>
      {/* Category banner */}
      {category.banner && (
        <div className="relative h-48 sm:h-64 overflow-hidden bg-accent">
          <Image src={category.banner} alt={category.name} fill />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {category.name}
            </h1>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: t("nav.home"), href: "/" },
            { label: t("nav.shop"), href: "/shop" },
            { label: category.name },
          ]}
          className="mb-6"
        />

        {/* Page header */}
        {!category.banner && (
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
            {category.description && (
              <p className="text-sm text-muted mt-1">{category.description}</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted">
            {t("shop.productsFound", { count: result.total })}
          </p>
          <Suspense fallback={null}>
            <FilterTrigger activeCount={activeFilters} categories={categories} />
          </Suspense>
        </div>

        <div>
          {result.products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-lg font-medium">{t("shop.noProducts")}</p>
              <p className="text-sm text-muted mt-1">
                {t("shop.adjustFilters")}
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
