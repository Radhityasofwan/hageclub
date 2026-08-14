"use client";

import { useEffect, useState } from "react";
import { ArticleCard } from "@/components/blog/article-card";
import { ArticleHero } from "@/components/blog/article-hero";
import { NewsletterSection } from "@/components/blog/newsletter-section";
import { useI18n } from "@/lib/i18n/client";

interface Article {
  slug: string;
  title: string;
  excerpt: string | null;
  featuredImage: string | null;
  category: { name: string; slug: string };
  author: string;
  publishedAt: string;
  readingTime: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { posts: number };
}

export default function BlogPage() {
  const { t } = useI18n();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categorySlug, setCategorySlug] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchArticles(p = 1, catSlug = categorySlug) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "9" });
      if (catSlug) params.set("category", catSlug);
      const res = await fetch(`/api/blog?${params}`);
      const json = await res.json();
      if (json.success) {
        const data = json.data;
        setArticles(data.articles ?? []);
        setPage(data.page ?? 1);
        setTotalPages(data.totalPages ?? 1);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const res = await fetch("/api/admin/blog/categories");
      const json = await res.json();
      if (json.success) setCategories(json.data ?? []);
    } catch {
      // silent
    }
  }

  useEffect(() => { fetchArticles(); fetchCategories(); }, []);

  function handleCategoryClick(slug: string) {
    const next = slug === categorySlug ? "" : slug;
    setCategorySlug(next);
    fetchArticles(1, next);
  }

  const featured = !categorySlug && articles.length > 0 ? articles[0] : null;
  const gridArticles = featured ? articles.slice(1) : articles;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t("blog.title")}</h1>
        <p className="text-sm text-muted mt-1">
          {t("blog.subtitle")}
        </p>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => handleCategoryClick("")}
          className={`h-8 px-3 rounded text-xs font-medium border border-border transition-colors ${
            !categorySlug ? "bg-primary text-white border-primary" : "bg-white hover:bg-accent"
          }`}
        >
          {t("blog.allCategories")}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat.slug)}
            className={`h-8 px-3 rounded text-xs font-medium border border-border transition-colors ${
              categorySlug === cat.slug ? "bg-primary text-white border-primary" : "bg-white hover:bg-accent"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Hero article */}
      {featured && !loading && (
        <div className="mb-8">
          <ArticleHero {...featured} />
        </div>
      )}

      {/* Article grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gridArticles.map((article) => (
          <ArticleCard key={article.slug} {...article} />
        ))}
      </div>

      {!loading && articles.length === 0 && (
        <div className="text-center py-12 text-sm text-muted">
          {t("blog.noArticles")}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-border rounded overflow-hidden animate-pulse">
              <div className="aspect-[16/9] bg-accent" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-accent rounded w-16" />
                <div className="h-4 bg-accent rounded w-full" />
                <div className="h-3 bg-accent rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          {page > 1 && (
            <button
              onClick={() => fetchArticles(page - 1)}
              className="h-9 px-4 border border-border rounded text-sm hover:bg-accent transition-colors"
            >
              {t("common.previous")}
            </button>
          )}
          <span className="text-sm text-muted">
            {t("pagination.currentPage", {
              page: page.toString(),
              totalPages: totalPages.toString(),
            })}
          </span>
          {page < totalPages && (
            <button
              onClick={() => fetchArticles(page + 1)}
              className="h-9 px-4 border border-border rounded text-sm hover:bg-accent transition-colors"
            >
              {t("common.next")}
            </button>
          )}
        </div>
      )}

      {/* Newsletter */}
      <div className="mt-12">
        <NewsletterSection />
      </div>
    </div>
  );
}
