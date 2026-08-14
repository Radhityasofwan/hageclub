"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "./product-card";
import { useI18n } from "@/lib/i18n/client";
import type { ProductCardData } from "@/types/product";

const STORAGE_KEY = "hageclub-recently-viewed";
const MAX_ITEMS = 8;

export function useRecentlyViewed() {
  function get(): ProductCardData[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function add(product: ProductCardData) {
    try {
      const list = get().filter((p) => p.id !== product.id);
      const updated = [product, ...list].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore localStorage errors
    }
  }

  return { get, add };
}

interface RecentlyViewedProps {
  currentProductId: string;
}

export function RecentlyViewed({ currentProductId }: RecentlyViewedProps) {
  const { t } = useI18n();
  const [products, setProducts] = useState<ProductCardData[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const all: ProductCardData[] = raw ? JSON.parse(raw) : [];
      setProducts(all.filter((p) => p.id !== currentProductId));
    } catch {
      setProducts([]);
    }
  }, [currentProductId]);

  if (!products.length) return null;

  return (
    <section className="mt-16">
      <h2 className="text-xl font-bold tracking-tight mb-6">{t("product.recentlyViewed")}</h2>

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
        {products.slice(0, 4).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
