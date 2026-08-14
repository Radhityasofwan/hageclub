"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { UploadField } from "@/components/admin/upload-field";
import { slugify } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

interface CategoryFormProps {
  initialData?: {
    id?: string;
    name: string;
    slug: string;
    description: string | null;
    banner: string | null;
    parentId: string | null;
    sortOrder: number;
    active: boolean;
    seoTitle: string | null;
    seoDescription: string | null;
  };
  categories: Category[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function CategoryForm({
  initialData,
  categories,
  onSuccess,
  onCancel,
}: CategoryFormProps) {
  const isEditing = !!initialData?.id;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [manualSlug, setManualSlug] = useState(false);

  const [name, setName] = useState(initialData?.name ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [banner, setBanner] = useState(initialData?.banner ?? "");
  const [parentId, setParentId] = useState(initialData?.parentId ?? "");
  const [active, setActive] = useState(initialData?.active ?? true);
  const [seoTitle, setSeoTitle] = useState(initialData?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initialData?.seoDescription ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const resolvedParentId = parentId || null;
      const sortOrder = isEditing
        ? (initialData?.sortOrder ?? 0)
        : categories.filter((c) => c.parentId === resolvedParentId).length;

      const payload = {
        name,
        slug,
        description: description || null,
        banner: banner || null,
        parentId: resolvedParentId,
        sortOrder,
        active,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
      };

      const url = isEditing
        ? `/api/admin/categories/${initialData.id}`
        : "/api/admin/categories";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.message ?? "Failed to save category");
        return;
      }

      onSuccess();
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const parentOptions = categories
    .filter((c) => c.id !== initialData?.id)
    .map((c) => ({ value: c.id, label: c.name }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <Input
        label="Name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (!manualSlug) setSlug(slugify(e.target.value));
        }}
        required
      />
      <div className="flex items-end gap-1">
        <div className="flex-1">
          <Input
            label="Slug"
            value={slug}
            onChange={(e) => {
              setManualSlug(true);
              setSlug(e.target.value);
            }}
            required
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setManualSlug(false);
            setSlug(slugify(name));
          }}
          className="h-10 px-2 bg-accent rounded text-xs text-muted hover:text-primary"
        >
          Auto
        </button>
      </div>

      <Select
        label="Parent Category"
        options={[{ value: "", label: "None (Top Level)" }, ...parentOptions]}
        value={parentId}
        onChange={(e) => setParentId(e.target.value)}
      />
      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
      />
      <UploadField
        value={banner}
        onChange={setBanner}
        label="Banner Kategori"
        hint="Dipakai sebagai gambar di tab Highlight Kategori homepage. Rasio 3:4 disarankan. Jika dikosongkan, homepage otomatis pakai foto produk featured atau terbaru di kategori ini."
        folder="categories"
      />
      {/* Active toggle */}
      <label className="flex items-center gap-3 py-2 cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-accent rounded-full peer-checked:bg-primary transition-colors" />
          <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform" />
        </div>
        <div>
          <p className="text-sm font-medium">Active</p>
          <p className="text-xs text-muted">Inactive categories are hidden from public menu and product filters</p>
        </div>
      </label>

      <div className="border-t border-border pt-4 space-y-3">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider">
          SEO
        </p>
        <Input
          label="SEO Title"
          value={seoTitle}
          onChange={(e) => setSeoTitle(e.target.value)}
        />
        <Textarea
          label="SEO Description"
          value={seoDescription}
          onChange={(e) => setSeoDescription(e.target.value)}
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {isEditing ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
