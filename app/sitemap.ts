import { MetadataRoute } from "next";
import { db } from "@/lib/db";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://hageclub.com";

const staticPages: Array<{ path: string; priority: number; changeFreq: "daily" | "weekly" | "monthly" }> = [
  { path: "", priority: 1.0, changeFreq: "daily" },
  { path: "/shop", priority: 0.9, changeFreq: "daily" },
  { path: "/blog", priority: 0.8, changeFreq: "daily" },
  { path: "/about", priority: 0.5, changeFreq: "monthly" },
  { path: "/contact", priority: 0.4, changeFreq: "monthly" },
  { path: "/faq", priority: 0.5, changeFreq: "weekly" },
  { path: "/privacy-policy", priority: 0.3, changeFreq: "monthly" },
  { path: "/terms-conditions", priority: 0.3, changeFreq: "monthly" },
  { path: "/shipping-info", priority: 0.4, changeFreq: "monthly" },
];

export const revalidate = 86400; // regenerate daily

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let products: { slug: string; updatedAt: Date }[] = [];
  let blogPosts: { slug: string; updatedAt: Date }[] = [];
  let categories: { slug: string; updatedAt: Date }[] = [];

  try {
    [products, blogPosts, categories] = await Promise.all([
      db.product.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
      db.blogPost.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
      db.category.findMany({ select: { slug: true, updatedAt: true } }),
    ]);
  } catch {
    // DB not ready yet — return static pages only
  }

  return [
    ...staticPages.map((page) => ({
      url: `${BASE_URL}${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.changeFreq as "daily" | "weekly" | "monthly",
      priority: page.priority,
    })),
    ...products.map((p) => ({
      url: `${BASE_URL}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...blogPosts.map((p) => ({
      url: `${BASE_URL}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...categories.map((c) => ({
      url: `${BASE_URL}/shop/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
