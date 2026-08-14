"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { BlogForm } from "@/components/admin/blog-form";

interface BlogDetail {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featuredImage: string | null;
  categoryId: string;
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED";
  publishedAt: string | null;
  readingTime: number;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  tags: Array<{ id: string; name: string; slug: string }>;
  category: { id: string; name: string };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function EditBlogPage() {
  const params = useParams();
  const [post, setPost] = useState<BlogDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [postRes, catRes] = await Promise.all([
        fetch(`/api/admin/blog/${params.id}`),
        fetch("/api/admin/blog/categories"),
      ]);
      const postJson = await postRes.json();
      const catJson = await catRes.json();
      if (postJson.success) setPost(postJson.data);
      if (catJson.success) setCategories(catJson.data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 bg-accent rounded w-48" /><div className="h-64 bg-accent rounded" /></div>;
  }

  if (!post) {
    return <div className="text-center py-8 text-sm text-muted">Post not found.<br /><Link href="/admin/blog" className="text-primary hover:underline mt-2 inline-block">← Back to Blog</Link></div>;
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/blog" className="text-xs text-muted hover:text-primary transition-colors">← Back to Blog</Link>
      <div>
        <h1 className="text-lg font-bold">{post.title}</h1>
        <p className="text-sm text-muted">Edit article</p>
      </div>
      <BlogForm
        initialData={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt ?? "",
          featuredImage: post.featuredImage ?? "",
          categoryId: post.categoryId,
          tags: post.tags.map((t) => t.slug),
          status: post.status,
          publishedAt: post.publishedAt ? post.publishedAt.slice(0, 16) : "",
          seoTitle: post.seoTitle ?? "",
          seoDescription: post.seoDescription ?? "",
          seoKeywords: post.seoKeywords ?? "",
        }}
        categories={categories}
      />
    </div>
  );
}
