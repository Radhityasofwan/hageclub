"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CmsPageForm } from "@/components/admin/cms-page-form";

interface CmsPageDetail {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  image: string | null;
  showInFooter: boolean;
  sortOrder: number;
  isPublished: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
}

export default function EditCmsPage() {
  const params = useParams();
  const [page, setPage] = useState<CmsPageDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPage = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/cms-pages/${params.id}`);
      const json = await res.json();
      if (res.ok) setPage(json.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-accent rounded w-48" />
        <div className="h-64 bg-accent rounded" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="text-center py-8 text-sm text-muted">
        Halaman tidak ditemukan.
        <br />
        <Link href="/admin/content/pages" className="text-primary hover:underline mt-2 inline-block">
          ← Kembali ke Halaman
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/content/pages" className="text-xs text-muted hover:text-primary transition-colors">
        ← Kembali ke Halaman
      </Link>
      <div>
        <h1 className="text-lg font-bold">{page.title}</h1>
        <p className="text-sm text-muted">Edit halaman statis.</p>
      </div>
      <CmsPageForm
        initialData={{
          id: page.id,
          title: page.title,
          slug: page.slug,
          content: page.content,
          excerpt: page.excerpt ?? "",
          image: page.image ?? "",
          showInFooter: page.showInFooter,
          sortOrder: page.sortOrder,
          isPublished: page.isPublished,
          seoTitle: page.seoTitle ?? "",
          seoDescription: page.seoDescription ?? "",
        }}
      />
    </div>
  );
}
