import type { SectionWithContent } from "@/lib/queries/homepage";
import { HeroSection } from "./hero-section";
import type { HeroContent } from "./hero-section";
import { FeaturesSection } from "./features-section";
import type { FeaturesContent } from "./features-section";
import { BrandStorySection } from "./brand-story-section";
import type { BrandStoryContent } from "./brand-story-section";
import { TestimonialsSection } from "./testimonials-section";
import type { TestimonialsContent } from "./testimonials-section";
import { BannerSection } from "./banner-section";
import type { BannerContent } from "./banner-section";
import { StatsSection } from "./stats-section";
import type { StatsContent } from "./stats-section";
import { CatalogSection } from "./catalog-section";
import type { CatalogContent } from "./catalog-section";

const typeLabels: Record<string, string> = {
  hero: "Hero Banner",
  catalog: "Product Catalog",
  features: "Features / Value Props",
  brand_story: "Brand Story",
  testimonials: "Testimonials",
  banner: "Promotional Banner",
  stats: "Statistics",
};

export function getSectionTypeLabel(type: string): string {
  return typeLabels[type] ?? type;
}

interface Props {
  section: SectionWithContent;
}

export async function SectionRenderer({ section }: Props) {
  const content = section.content as Record<string, unknown> | null;

  switch (section.type) {
    case "hero":
      return <HeroSection title={section.title} subtitle={section.subtitle} content={content as HeroContent | null} />;
    case "catalog":
      return <CatalogSection title={section.title} subtitle={section.subtitle} content={content as CatalogContent | null} />;
    case "features":
      return <FeaturesSection title={section.title} subtitle={section.subtitle} content={content as FeaturesContent | null} />;
    case "brand_story":
      return <BrandStorySection title={section.title} subtitle={section.subtitle} content={content as BrandStoryContent | null} />;
    case "testimonials":
      return <TestimonialsSection title={section.title} subtitle={section.subtitle} content={content as TestimonialsContent | null} />;
    case "banner":
      return <BannerSection title={section.title} subtitle={section.subtitle} content={content as BannerContent | null} />;
    case "stats":
      return <StatsSection title={section.title} subtitle={section.subtitle} content={content as StatsContent | null} />;
    default:
      return null;
  }
}

/** Preview-only — server components can't render inside admin context, so we use this for the admin panel */
const previewLabels: Record<string, string> = {
  hero: "Hero banner slider (auto-fade) — judul opacity rendah, tombol View More smooth-scroll ke section produk.",
  catalog: "Product section with 2 template choices: Product Grid (tabs, sort, view all) or Featured Product full screen (1 produk + countdown promo).",
  features: "Grid of value proposition columns (icons, titles, descriptions).",
  brand_story: "Image + text about the brand with optional CTA.",
  testimonials: "Customer review cards in a 3-column grid.",
  banner: "Full-width promotional banner with background image/color and CTA button.",
  stats: "Statistics counter row (years, products, customers).",
};

export function getSectionPreview(type: string): string {
  return previewLabels[type] ?? "";
}
