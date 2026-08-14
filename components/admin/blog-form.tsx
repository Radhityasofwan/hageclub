"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { MediaGrid } from "@/components/admin/media-grid";
import { TagInput } from "@/components/admin/tag-input";
import { UploadField } from "@/components/admin/upload-field";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface BlogFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  categoryId: string;
  tags: string[];
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED";
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
}

interface BlogFormProps {
  initialData?: BlogFormData & { id: string };
  categories: Category[];
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

export function BlogForm({ initialData, categories, onSuccess }: BlogFormProps) {
  const router = useRouter();
  const isEditing = !!initialData?.id;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [manualSlug, setManualSlug] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const [form, setForm] = useState<BlogFormData>(
    initialData ?? {
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      featuredImage: "",
      categoryId: "",
      tags: [],
      status: "DRAFT",
      publishedAt: "",
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
    }
  );

  useEffect(() => {
    if (!isEditing && !manualSlug && form.title) {
      setForm((prev) => ({ ...prev, slug: slugify(prev.title) }));
    }
  }, [form.title, isEditing, manualSlug]);

  const update = useCallback(<K extends keyof BlogFormData>(field: K, value: BlogFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = isEditing
        ? `/api/admin/blog/${initialData.id}`
        : "/api/admin/blog";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.message ?? "Failed to save");
        return;
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/admin/blog");
        router.refresh();
      }
    } catch {
      setError("Something went wrong");
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
            <h2 className="text-sm font-semibold tracking-widest uppercase">Article Content</h2>

            <Input
              label="Title"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Article title"
              required
            />

            <Input
              label="Slug"
              value={form.slug}
              onChange={(e) => { setManualSlug(true); update("slug", e.target.value); }}
              placeholder="article-url-slug"
              required
            />

            <Textarea
              label="Excerpt"
              value={form.excerpt}
              onChange={(e) => update("excerpt", e.target.value)}
              placeholder="Brief summary (max 160 characters)"
              rows={2}
              maxLength={160}
            />

            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">Content</label>
              <RichTextEditor
                value={form.content}
                onChange={(value) => update("content", value)}
                placeholder="Write your article content in Markdown..."
              />
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Publish */}
          <section className="bg-white border border-border rounded p-4 space-y-3">
            <h3 className="text-xs font-semibold tracking-widest uppercase text-muted">Publish</h3>

            <Select
              label="Status"
              options={[
                { value: "DRAFT", label: "Draft" },
                { value: "PUBLISHED", label: "Published" },
                { value: "SCHEDULED", label: "Scheduled" },
              ]}
              value={form.status}
              onChange={(e) => update("status", e.target.value as BlogFormData["status"])}
            />

            {form.status === "SCHEDULED" && (
              <Input
                label="Publish Date"
                type="datetime-local"
                value={form.publishedAt}
                onChange={(e) => update("publishedAt", e.target.value)}
              />
            )}
          </section>

          {/* Category */}
          <section className="bg-white border border-border rounded p-4 space-y-3">
            <h3 className="text-xs font-semibold tracking-widest uppercase text-muted">Category</h3>
            <Select
              label="Category"
              options={[
                { value: "", label: "Select category..." },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
              value={form.categoryId}
              onChange={(e) => update("categoryId", e.target.value)}
              placeholder="Select category..."
            />
          </section>

          {/* Featured Image */}
          <section className="bg-white border border-border rounded p-4 space-y-3">
            <h3 className="text-xs font-semibold tracking-widest uppercase text-muted">Featured Image</h3>
            <UploadField
              value={form.featuredImage}
              onChange={(url) => update("featuredImage", url)}
              label="Upload gambar artikel"
              folder="blog"
              previewClassName="w-full h-32"
            />
            <button
              type="button"
              onClick={() => setShowMediaPicker(true)}
              className="text-xs text-muted hover:text-primary transition-colors"
            >
              Atau pilih dari Media Library →
            </button>
          </section>

          {/* Tags */}
          <section className="bg-white border border-border rounded p-4 space-y-3">
            <TagInput
              tags={form.tags}
              onChange={(tags) => update("tags", tags)}
            />
          </section>

          {/* SEO */}
          <section className="bg-white border border-border rounded p-4 space-y-3">
            <h3 className="text-xs font-semibold tracking-widest uppercase text-muted">SEO</h3>
            <Input
              label="SEO Title"
              value={form.seoTitle}
              onChange={(e) => update("seoTitle", e.target.value)}
              placeholder="Leave empty to use article title"
              maxLength={70}
            />
            <Textarea
              label="Meta Description"
              value={form.seoDescription}
              onChange={(e) => update("seoDescription", e.target.value)}
              rows={2}
              maxLength={160}
            />
            <Input
              label="Keywords (comma separated)"
              value={form.seoKeywords}
              onChange={(e) => update("seoKeywords", e.target.value)}
              placeholder="keyword1, keyword2"
            />
          </section>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {isEditing ? "Update Article" : "Create Article"}
        </Button>
      </div>

      {/* Media picker modal */}
      <Modal
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        title="Select Featured Image"
        size="lg"
      >
        <MediaPickerInline onSelect={(url) => { update("featuredImage", url); setShowMediaPicker(false); }} />
      </Modal>
    </form>
  );
}

function MediaPickerInline({ onSelect }: { onSelect: (url: string) => void }) {
  const [media, setMedia] = useState<Array<{ id: string; url: string; filename: string; mimeType: string; size: number; alt: string | null; folder: string | null; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);

  const fetchMedia = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/media?limit=50");
      const json = await res.json();
      if (json.success) setMedia(json.data.media ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  return (
    <MediaGrid
      media={media}
      loading={loading}
      onRefresh={fetchMedia}
      selectable
      onSelect={(item) => onSelect(item.url)}
    />
  );
}
