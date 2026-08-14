"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CmsPageRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  showInFooter: boolean;
  sortOrder: number;
  isPublished: boolean;
  updatedAt: string;
}

export default function ContentPagesPage() {
  const [pages, setPages] = useState<CmsPageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function fetchPages() {
    try {
      const res = await fetch("/api/admin/cms-pages");
      const json = await res.json();
      if (res.ok) setPages(json.data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPages();
  }, []);

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus halaman ini? Tindakan tidak bisa dibatalkan.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/cms-pages/${id}`, { method: "DELETE" });
      if (res.ok) {
        showMessage("success", "Halaman dihapus");
        fetchPages();
      } else {
        showMessage("error", "Gagal menghapus halaman");
      }
    } catch {
      showMessage("error", "Terjadi kesalahan");
    } finally {
      setDeleting(null);
    }
  }

  async function handleTogglePublish(page: CmsPageRow) {
    try {
      const res = await fetch(`/api/admin/cms-pages/${page.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...page, isPublished: !page.isPublished }),
      });
      if (!res.ok) {
        showMessage("error", "Gagal menyimpan");
        return;
      }
      fetchPages();
    } catch {
      showMessage("error", "Terjadi kesalahan");
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-destructive/10 text-destructive border border-destructive/20"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Halaman</h1>
          <p className="text-sm text-muted">
            Kelola halaman statis — kontennya tampil di halaman publik & footer.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/content/faq">
            <Button variant="secondary">FAQ</Button>
          </Link>
          <Link href="/admin/content/contact">
            <Button variant="secondary">Info Kontak</Button>
          </Link>
          <Link href="/admin/content/pages/new">
            <Button>+ Halaman Baru</Button>
          </Link>
        </div>
      </div>

      <div className="bg-white border border-border rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Judul</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Slug</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Footer</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Urutan</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Status</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/admin/content/pages/${page.id}`} className="font-medium text-primary hover:underline">
                      {page.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs text-muted">/{page.slug}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted">{page.showInFooter ? "Ya" : "—"}</td>
                  <td className="px-5 py-3 text-xs text-muted">{page.sortOrder}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleTogglePublish(page)}
                      title="Klik untuk ubah status"
                    >
                      <Badge variant={page.isPublished ? "success" : "default"} size="sm">
                        {page.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/admin/content/pages/${page.id}`} className="text-xs text-muted hover:text-primary">
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(page.id)}
                        disabled={deleting === page.id}
                        className="text-xs text-destructive hover:underline disabled:opacity-50"
                      >
                        {deleting === page.id ? "..." : "Hapus"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pages.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted">
                    {loading ? "Loading..." : "Belum ada halaman. Buat halaman pertama."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
