import { getI18n } from "@/lib/i18n/server";
import { ProductCard } from "./product-card";
import type { ProductCardData } from "@/types/product";

interface RelatedProductsProps {
  products: ProductCardData[];
}

export async function RelatedProducts({ products }: RelatedProductsProps) {
  const { t } = await getI18n();

  if (!products.length) return null;

  return (
    <section className="mt-16">
      <h2 className="text-xl font-bold tracking-tight mb-6">{t("product.relatedProducts")}</h2>

      {/* Mobile: horizontal scroll */}
      <div className="sm:hidden flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {products.map((p) => (
          <div key={p.id} className="w-40 shrink-0">
            <ProductCard product={p} />
          </div>
        ))}
      </div>

      {/* Desktop: grid */}
      <div className="hidden sm:grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
