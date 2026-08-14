"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/client";

interface ArticleCardProps {
  slug: string;
  title: string;
  excerpt: string | null;
  featuredImage: string | null;
  category: { name: string; slug: string };
  author: string;
  publishedAt: string;
  readingTime: number;
}

function formatDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale === "en" ? "en-US" : "id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export function ArticleCard({
  slug, title, excerpt, featuredImage, category, author, publishedAt, readingTime,
}: ArticleCardProps) {
  const { t, locale } = useI18n();
  return (
    <Link href={`/blog/${slug}`} className="group block">
      <article className="border border-border rounded overflow-hidden bg-white transition-shadow hover:shadow-sm">
        {/* Cover image */}
        <div className="aspect-[16/9] bg-accent overflow-hidden">
          {featuredImage ? (
            <img
              src={featuredImage}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted text-xs">
              {t("blog.noImage")}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            {category.name}
          </span>
          <h3 className="text-sm font-bold line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          {excerpt && (
            <p className="text-xs text-muted line-clamp-3">{excerpt}</p>
          )}
          <div className="flex items-center gap-3 text-[10px] text-muted pt-1">
            <span>{author}</span>
            <span>•</span>
            <span>{formatDate(publishedAt, locale)}</span>
            <span>•</span>
            <span>{t("blog.readTime", { readingTime })}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
