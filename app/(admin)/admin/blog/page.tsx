"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED";
  publishedAt: string | null;
  readingTime: number;
  createdAt: string;
  category: { id: string; name: string };
  author: string;
  tags: Array<{ id: string; name: string; slug: string }>;
}

const STATUS_BADGES: Record<string, "default" | "success" | "warning"> = {
  DRAFT: "default",
  PUBLISHED: "success",
  SCHEDULED: "warning",
};

export default function BlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function fetchData(p = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/blog?${params}`);
      const json = await res.json();
      const data = json.data ?? {};
      setPosts(data.posts ?? []);
      setTotal(data.total ?? 0);
      setPage(data.page ?? 1);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(1); }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchData(1);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this article? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
      if (res.ok) fetchData(page);
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  }

  async function handleTogglePublish(post: BlogPost) {
    const publish = post.status !== "PUBLISHED";
    await fetch(`/api/admin/blog/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publish }),
    });
    fetchData(page);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Blog Posts</h1>
          <p className="text-sm text-muted">{total} total articles</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/blog/categories">
            <Button variant="secondary">Categories</Button>
          </Link>
          <Link href="/admin/blog/new">
            <Button>+ New Article</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-end">
        <form onSubmit={handleSearch} className="flex gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title..."
              className="h-9 px-3 border border-border rounded text-sm w-64 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 border border-border rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="SCHEDULED">Scheduled</option>
            </select>
          </div>
          <button type="submit" className="h-9 px-4 bg-accent rounded text-sm font-medium hover:bg-accent/70 transition-colors">
            Search
          </button>
        </form>
        {statusFilter && (
          <button onClick={() => { setStatusFilter(""); fetchData(1); }} className="h-9 px-3 text-xs text-muted hover:text-primary">
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Title</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Author</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Category</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Status</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase">Published</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/admin/blog/${post.id}`} className="font-medium text-primary hover:underline">
                      {post.title}
                    </Link>
                    <div className="text-[10px] text-muted mt-0.5">{post.readingTime} min read</div>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted">{post.author}</td>
                  <td className="px-5 py-3">
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-accent">
                      {post.category.name}
                    </span>
                  </td>
                  <td className="px-5 py-3"><Badge variant={STATUS_BADGES[post.status] ?? "default"} size="sm">{post.status}</Badge></td>
                  <td className="px-5 py-3 text-right text-xs text-muted">
                    {post.publishedAt ? formatDateTime(post.publishedAt).slice(0, 10) : "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleTogglePublish(post)}
                        className="text-xs text-muted hover:text-primary"
                      >
                        {post.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={deleting === post.id}
                        className="text-xs text-destructive hover:underline disabled:opacity-50"
                      >
                        {deleting === post.id ? "..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted">
                    {loading ? "Loading..." : "No articles found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-xs text-muted">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && <button onClick={() => fetchData(page - 1)} className="h-8 px-3 border border-border rounded text-xs hover:bg-accent">Previous</button>}
              {page < totalPages && <button onClick={() => fetchData(page + 1)} className="h-8 px-3 border border-border rounded text-xs hover:bg-accent">Next</button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
