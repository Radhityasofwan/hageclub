"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { UploadField } from "@/components/admin/upload-field";

interface CmsPageFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  image: string;
  showInFooter: boolean;
  sortOrder: number;
  isPublished: boolean;
  seoTitle: string;
  seoDescription: string;
}

interface CmsPageFormProps {
  initialData?: CmsPageFormData & { id: string };
  onSuccess?: () => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function CmsPageForm({ initialData, onSuccess }: CmsPageFormProps) {
  const router = useRouter();
  const isEditing = !!initialData?.id;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [manualSlug, setManualSlug] = useState(false);

  const [form, setForm] = useState<CmsPageFormData>(
    initialData ?? {
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      image: "",
      showInFooter: true,
      sortOrder: 0,
      isPublished: true,
      seoTitle: "",
      seoDescription: "",
    }
  );

  useEffect(() => {
    if (!isEditing && !manualSlug && form.title) {
      setForm((prev) => ({ ...prev, slug: slugify(prev.title) }));
    }
  }, [form.title, isEditing, manualSlug]);

  const update = useCallback(
    <K extends keyof CmsPageFormData>(field: K, value: CmsPageFormData[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = isEditing
        ? `/api/admin/cms-pages/${initialData.id}`
        : "/api/admin/cms-pages";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.message ?? "Gagal menyimpan");
        return;
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/admin/content/pages");
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-[1fr_280px] gap-6">
        {/* Main content */}
        <div className="space-y-6">
          <section className="bg-white border border-border rounded p-5 space-y-4">
            <h2 className="text-sm font-semibold tracking-widest uppercase">Konten Halaman</h2>

            <Input
              label="Judul"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Judul halaman"
              required
            />

            <Input
              label="Slug"
              value={form.slug}
              onChange={(e) => {
                setManualSlug(true);
                update("slug", e.target.value);
              }}
              placeholder="url-slug-halaman"
              required
            />

            <Textarea
              label="Ringkasan (excerpt)"
              value={form.excerpt}
              onChange={(e) => update("excerpt", e.target.value)}
              placeholder="Ringkasan singkat yang tampil sebagai subtitle/deskripsi"
              rows={2}
              maxLength={200}
            />

            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">Isi Halaman</label>
              <RichTextEditor
                value={form.content}
                onChange={(value) => update("content", value)}
                placeholder="Tulis konten halaman dalam Markdown..."
              />
            </div>
          </section>

          {/* SEO */}
          <section className="bg-white border border-border rounded p-5 space-y-4">
            <h2 className="text-sm font-semibold tracking-widest uppercase">SEO</h2>
            <Input
              label="SEO Title"
              value={form.seoTitle}
              onChange={(e) => update("seoTitle", e.target.value)}
              placeholder="Kosongkan untuk memakai judul halaman"
              maxLength={70}
            />
            <Textarea
              label="Meta Description"
              value={form.seoDescription}
              onChange={(e) => update("seoDescription", e.target.value)}
              rows={2}
              maxLength={160}
            />
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Publish */}
          <section className="bg-white border border-border rounded p-4 space-y-3">
            <h3 className="text-xs font-semibold tracking-widest uppercase text-muted">Publikasi</h3>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => update("isPublished", e.target.checked)}
                className="accent-primary"
              />
              Dipublikasikan
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.showInFooter}
                onChange={(e) => update("showInFooter", e.target.checked)}
                className="accent-primary"
              />
              Tampil di footer
            </label>
            <Input
              label="Urutan (sort order)"
              type="number"
              min={0}
              value={String(form.sortOrder)}
              onChange={(e) => update("sortOrder", Number(e.target.value) || 0)}
            />
          </section>

          {/* Image */}
          <section className="bg-white border border-border rounded p-4 space-y-3">
            <h3 className="text-xs font-semibold tracking-widest uppercase text-muted">Gambar Hero</h3>
            <UploadField
              value={form.image}
              onChange={(url) => update("image", url)}
              label="Upload gambar (opsional)"
              folder="pages"
              previewClassName="w-full h-32"
            />
          </section>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Batal
        </Button>
        <Button type="submit" loading={saving}>
          {isEditing ? "Simpan Perubahan" : "Buat Halaman"}
        </Button>
      </div>
    </form>
  );
}
