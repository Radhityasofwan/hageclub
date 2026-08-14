import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://hageclub.com";
const DEFAULT_TITLE = "HAGE CLUB — The Pinnacle of Refined Comfort";
const DEFAULT_DESC =
  "Premium automotive lifestyle fashion brand. Quality, comfort, authenticity, and timelessness in every piece.";

export interface SeoOptions {
  title?: string | null;
  description?: string | null;
  url?: string;
  ogImage?: string | null;
  noIndex?: boolean;
  canonical?: string;
  publishedAt?: string | null;
  author?: string;
}

export function buildMetadata(opts: SeoOptions): Metadata {
  const title = opts.title ?? DEFAULT_TITLE;
  const description = opts.description ?? DEFAULT_DESC;

  return {
    title,
    description,
    ...(opts.noIndex && { robots: { index: false, follow: false } }),
    ...(opts.canonical && {
      alternates: { canonical: opts.canonical },
    }),
    openGraph: {
      title,
      description,
      url: opts.url ?? BASE_URL,
      siteName: "HAGE CLUB",
      locale: "id_ID",
      type: "website",
      ...(opts.ogImage && {
        images: [{ url: opts.ogImage, width: 1200, height: 630, alt: title }],
      }),
      ...(opts.publishedAt && { publishedTime: opts.publishedAt }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function buildProductMetadata(product: {
  name: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  description?: string | null;
  images?: Array<{ url: string; alt?: string | null }>;
  category?: { name: string };
  slug: string;
}): Metadata {
  const cover = product.images?.[0];
  return buildMetadata({
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? product.description ?? `${product.name} — ${product.category?.name ?? ""} from HAGE CLUB`,
    url: `${BASE_URL}/products/${product.slug}`,
    ogImage: cover?.url ?? null,
  });
}

export function buildBlogMetadata(article: {
  title: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  excerpt?: string | null;
  featuredImage?: string | null;
  slug: string;
  publishedAt?: string | null;
}): Metadata {
  return buildMetadata({
    title: article.seoTitle ?? article.title,
    description: article.seoDescription ?? article.excerpt ?? "",
    url: `${BASE_URL}/blog/${article.slug}`,
    ogImage: article.featuredImage ?? null,
    publishedAt: article.publishedAt ?? undefined,
  });
}

export function buildCategoryMetadata(category: {
  name: string;
  description?: string | null;
  slug: string;
}): Metadata {
  return buildMetadata({
    title: category.name,
    description: category.description ?? `Explore the ${category.name} collection from HAGE CLUB.`,
    url: `${BASE_URL}/shop/${category.slug}`,
  });
}

export { BASE_URL, DEFAULT_TITLE, DEFAULT_DESC };
