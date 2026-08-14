import { db } from "@/lib/db";
import { getCatalogHighlights, getFeaturedProductCard } from "@/lib/queries/product";
import { CatalogClient, type CategoryCardData } from "./catalog-client";
import { FeaturedProductSection } from "./featured-product-section";

export interface CatalogContent {
  sectionTitle?: string;
  productCount?: number;
  sortBy?: string;
  showSortDropdown?: boolean;
  showViewAll?: boolean;
  viewAllLinkText?: string;
  viewAllLink?: string;
  // Template: "grid" (default) atau "featured" (Featured Product full screen)
  template?: "grid" | "featured";
  featuredProductId?: string;
  showCountdown?: boolean;
  campaignTitle?: string;
  campaignEndDate?: string;
}

interface Props {
  title?: string | null;
  subtitle?: string | null;
  content: CatalogContent | null;
}

export async function CatalogSection({ title, subtitle, content }: Props) {
  const c = content ?? {};

  // Template Featured Product — 1 produk unggulan full screen
  if (c.template === "featured") {
    const product = c.featuredProductId
      ? await getFeaturedProductCard(c.featuredProductId)
      : null;
    return (
      <FeaturedProductSection
        title={title || c.sectionTitle}
        subtitle={subtitle}
        product={product}
        showCountdown={c.showCountdown}
        campaignTitle={c.campaignTitle}
        campaignEndDate={c.campaignEndDate}
      />
    );
  }

  const allLimit = Math.min(48, Math.max(4, c.productCount ?? 8));

  // Fetch categories and "Semua Produk" highlights in parallel
  const [categories, allProducts] = await Promise.all([
    db.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true, banner: true },
    }),
    getCatalogHighlights(allLimit),
  ]);

  // Fetch one highlighted product per category (for the category card image)
  const categoryHighlights = await Promise.all(
    categories.map((cat) => getCatalogHighlights(1, cat.slug))
  );

  const categoryCards: CategoryCardData[] = categories.map((cat, i) => {
    const highlight = categoryHighlights[i][0];
    const coverImg =
      highlight?.images.find((img) => img.isCover) ?? highlight?.images[0];
    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      image: cat.banner ?? coverImg?.url ?? null,
      imageAlt: coverImg?.alt ?? cat.name,
    };
  });

  return (
    <CatalogClient
      title={title || c.sectionTitle || "Koleksi Kami"}
      subtitle={subtitle}
      allProducts={allProducts}
      categoryCards={categoryCards}
      showSortDropdown={c.showSortDropdown !== false}
      showViewAll={c.showViewAll !== false}
      viewAllLink={c.viewAllLink || "/shop"}
      viewAllText={c.viewAllLinkText || "Lihat Semua Produk"}
      showCountdown={c.showCountdown}
      campaignTitle={c.campaignTitle}
      campaignEndDate={c.campaignEndDate}
    />
  );
}
