"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ImageUploader } from "@/components/admin/image-uploader";
import { VariantManager } from "@/components/admin/variant-manager";
import { UploadField } from "@/components/admin/upload-field";
import { slugify } from "@/lib/utils";

// Editor WYSIWYG hanya berjalan di client (ProseMirror butuh DOM)
const TiptapEditor = dynamic(
  () =>
    import("@/components/admin/tiptap-editor").then((m) => m.TiptapEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-[190px] border border-border rounded bg-accent/50 animate-pulse" />
    ),
  }
);

interface Category {
  id: string;
  name: string;
}

interface ProductFormData {
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  fullDescription: string;
  price: number;
  salePrice: number | null;
  weight: number;
  width: number | null;
  height: number | null;
  length: number | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  stock: number;
  featured: boolean;
  isNew: boolean;
  categoryId: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  sizeGuideImageUrl: string;
  images: { url: string; alt?: string | null; isCover?: boolean; sortOrder?: number }[];
  variants: {
    name: string;
    sku: string;
    price: number | null;
    stock: number;
    attributes: Record<string, string>;
    isActive: boolean;
  }[];
}

interface ProductFormProps {
  initialData?: ProductFormData & { id?: string };
  categories: Category[];
}

interface FormError {
  message: string;
  fields?: Record<string, string[]>;
  devError?: {
    message?: string;
    name?: string;
    code?: string;
    meta?: unknown;
    stack?: string;
  };
}

export function ProductForm({ initialData, categories }: ProductFormProps) {
  const router = useRouter();
  const isEditing = !!initialData?.id;
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<FormError | null>(null);
  const [manualSlug, setManualSlug] = useState(false);

  const [form, setForm] = useState<ProductFormData>(
    initialData ?? {
      name: "",
      slug: "",
      sku: "",
      shortDescription: "",
      fullDescription: "",
      price: 0,
      salePrice: null,
      weight: 0,
      width: null,
      height: null,
      length: null,
      status: "DRAFT",
      stock: 0,
      featured: false,
      isNew: false,
      categoryId: categories[0]?.id ?? "",
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
      sizeGuideImageUrl: "",
      images: [],
      variants: [],
    }
  );

  const handleChange = useCallback(
    <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => {
      setForm((prev) => {
        const updated = { ...prev, [field]: value };
        if (field === "name" && !manualSlug) {
          updated.slug = slugify(value as string);
        }
        return updated;
      });
    },
    [manualSlug]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      const payload = {
        ...form,
        price: Number(form.price),
        salePrice: form.salePrice ? Number(form.salePrice) : null,
        weight: Number(form.weight),
        width: form.width ? Number(form.width) : null,
        height: form.height ? Number(form.height) : null,
        length: form.length ? Number(form.length) : null,
        stock: Number(form.stock),
      };

      const url = isEditing
        ? `/api/admin/products/${initialData.id}`
        : "/api/admin/products";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        setFormError({
          message: json.message ?? "Failed to save product",
          fields: json.errors,
          devError: json.devError,
        });
        return;
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setFormError({
        message: "Network error — could not reach server",
        devError: {
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        },
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {formError && <FormErrorDisplay error={formError} />}

      {/* Basic Information */}
      <section className="bg-white border border-border rounded p-5 space-y-4">
        <h2 className="text-sm font-semibold tracking-widest uppercase">Basic Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Product Name"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
          />
          <div className="flex items-end gap-1">
            <div className="flex-1">
              <Input
                label="Slug"
                value={form.slug}
                onChange={(e) => {
                  setManualSlug(true);
                  handleChange("slug", e.target.value);
                }}
                required
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setManualSlug(false);
                handleChange("slug", slugify(form.name));
              }}
              className="h-10 px-2 bg-accent rounded text-xs text-muted hover:text-primary"
              title="Auto-generate from name"
            >
              Auto
            </button>
          </div>
          <Input
            label="SKU"
            value={form.sku}
            onChange={(e) => handleChange("sku", e.target.value)}
            required
          />
          <Select
            label="Category"
            options={categories.map((c) => ({
              value: c.id,
              label: c.name,
            }))}
            value={form.categoryId}
            onChange={(e) => handleChange("categoryId", e.target.value)}
            placeholder="Select category"
          />
        </div>

        <div>
          <Textarea
            label="Meta Description (tidak tampil di halaman produk)"
            value={form.shortDescription}
            onChange={(e) => handleChange("shortDescription", e.target.value)}
            rows={2}
            maxLength={500}
          />
          <p className="text-[11px] text-muted mt-1">
            Dipakai untuk meta SEO saja — tidak ditampilkan di halaman produk publik.
          </p>
        </div>
        <div>
          <TiptapEditor
            label="Full Description"
            value={form.fullDescription}
            onChange={(html) => handleChange("fullDescription", html)}
            placeholder="Tulis deskripsi produk…"
          />
          <p className="text-[11px] text-muted mt-1">
            Mendukung format tebal, miring, list poin &amp; angka — ditampilkan di halaman produk publik.
          </p>
        </div>
      </section>

      {/* Pricing & Stock */}
      <section className="bg-white border border-border rounded p-5 space-y-4">
        <h2 className="text-sm font-semibold tracking-widest uppercase">Pricing & Stock</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Price (IDR)"
            type="number"
            value={form.price}
            onChange={(e) => handleChange("price", Number(e.target.value))}
            required
          />
          <Input
            label="Sale Price"
            type="number"
            value={form.salePrice ?? ""}
            onChange={(e) =>
              handleChange(
                "salePrice",
                e.target.value ? Number(e.target.value) : null
              )
            }
          />
          {form.variants.length === 0 ? (
            <Input
              label="Stock"
              type="number"
              value={form.stock}
              onChange={(e) => handleChange("stock", Number(e.target.value))}
            />
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted">Stock</p>
              <div className="h-9 flex items-center px-3 border border-border rounded-sm bg-accent text-sm font-semibold">
                {form.variants.filter((v) => v.isActive).reduce((s, v) => s + v.stock, 0)}
              </div>
              <p className="text-[11px] text-muted">Otomatis dari total varian aktif</p>
            </div>
          )}
          <div className="flex items-end pb-1.5 gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => handleChange("featured", e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              Featured Product
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.isNew}
                onChange={(e) => handleChange("isNew", e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              Mark as New
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select
            label="Status"
            options={[
              { value: "DRAFT", label: "Draft" },
              { value: "PUBLISHED", label: "Published" },
              { value: "ARCHIVED", label: "Archived" },
            ]}
            value={form.status}
            onChange={(e) =>
              handleChange("status", e.target.value as ProductFormData["status"])
            }
            containerClassName="w-40"
          />
        </div>
      </section>

      {/* Images */}
      <section className="bg-white border border-border rounded p-5 space-y-4">
        <ImageUploader
          images={form.images}
          onChange={(images) => handleChange("images", images)}
        />
        <p className="text-xs text-muted">
          Foto cover (gambar pertama / yang ditandai cover) dipakai sebagai visual full screen
          pada template &quot;Featured Product (Full Screen)&quot; di homepage. Gambar diskalakan
          memenuhi seluruh layar (tanpa bar). Rekomendasi rasio 9:19.5 (mis. 1080×2340 px) agar
          crop minimal; rasio lain akan terpotong di sisi agar tetap penuh.
        </p>
      </section>

      {/* Size Guide Image */}
      <section className="bg-white border border-border rounded p-5 space-y-3">
        <div>
          <h2 className="text-sm font-semibold tracking-widest uppercase">Panduan Ukuran</h2>
          <p className="text-xs text-muted mt-1">
            Upload gambar tabel ukuran produk ini. Akan ditampilkan saat customer klik &quot;Panduan Ukuran&quot; di halaman produk.
          </p>
        </div>
        <UploadField
          label="Gambar Panduan Ukuran"
          value={form.sizeGuideImageUrl}
          onChange={(url) => handleChange("sizeGuideImageUrl", url)}
          folder="size-guides"
          hint="Upload gambar tabel ukuran (PNG/JPG). Jika kosong, akan tampil tabel ukuran default."
          previewClassName="w-32 h-20"
        />
      </section>

      {/* Shipping & Dimensions */}
      <section className="bg-white border border-border rounded p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold tracking-widest uppercase">Shipping & Dimensions</h2>
          <p className="text-xs text-muted mt-1">
            Berat dipakai untuk estimasi ongkir di halaman produk dan checkout. Dimensi dikirim ke Komship saat membuat order pengiriman.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Input
              label="Weight (grams)"
              type="number"
              min={1}
              required
              value={form.weight || ""}
              onChange={(e) => handleChange("weight", Number(e.target.value))}
              placeholder="cth: 300"
            />
            <p className="text-[11px] text-muted mt-1">Wajib — dipakai untuk kalkulasi ongkir</p>
          </div>
          <div>
            <Input
              label="Width (cm)"
              type="number"
              min={1}
              value={form.width ?? ""}
              onChange={(e) =>
                handleChange("width", e.target.value ? Number(e.target.value) : null)
              }
              placeholder="—"
            />
            <p className="text-[11px] text-muted mt-1">Opsional, default 1 jika kosong</p>
          </div>
          <div>
            <Input
              label="Height (cm)"
              type="number"
              min={1}
              value={form.height ?? ""}
              onChange={(e) =>
                handleChange("height", e.target.value ? Number(e.target.value) : null)
              }
              placeholder="—"
            />
            <p className="text-[11px] text-muted mt-1">Opsional, default 1 jika kosong</p>
          </div>
          <div>
            <Input
              label="Length (cm)"
              type="number"
              min={1}
              value={form.length ?? ""}
              onChange={(e) =>
                handleChange("length", e.target.value ? Number(e.target.value) : null)
              }
              placeholder="—"
            />
            <p className="text-[11px] text-muted mt-1">Opsional, default 1 jika kosong</p>
          </div>
        </div>

      </section>

      {/* Variants */}
      <section className="bg-white border border-border rounded p-5 space-y-4">
        <VariantManager
          variants={form.variants}
          onChange={(variants) => handleChange("variants", variants)}
          attributeOptions={[
            { name: "Size", values: ["XS", "S", "M", "L", "XL", "XXL"] },
          ]}
        />
      </section>

      {/* SEO */}
      <section className="bg-white border border-border rounded p-5 space-y-4">
        <h2 className="text-sm font-semibold tracking-widest uppercase">SEO</h2>

        <Input
          label="Meta Title"
          value={form.seoTitle}
          onChange={(e) => handleChange("seoTitle", e.target.value)}
        />
        <Textarea
          label="Meta Description"
          value={form.seoDescription}
          onChange={(e) => handleChange("seoDescription", e.target.value)}
          rows={2}
          maxLength={300}
        />
        <Input
          label="Meta Keywords"
          value={form.seoKeywords}
          onChange={(e) => handleChange("seoKeywords", e.target.value)}
          placeholder="Comma separated"
        />
      </section>

      {/* Actions */}
      {/* Repeat error at bottom so user sees it after scrolling */}
      {formError && <FormErrorDisplay error={formError} />}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button variant="primary" type="submit" loading={saving}>
          {isEditing ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Error display component — shown in dev mode with full details
// ---------------------------------------------------------------------------

interface FormErrorDisplayProps {
  error: {
    message: string;
    fields?: Record<string, string[]>;
    devError?: {
      message?: string;
      name?: string;
      code?: string;
      meta?: unknown;
      stack?: string;
    };
  };
}

function FormErrorDisplay({ error: err }: FormErrorDisplayProps) {
  const isDev = process.env.NODE_ENV === "development";
  const fieldEntries = err.fields ? Object.entries(err.fields) : [];

  return (
    <div className="bg-destructive/10 border border-destructive/30 rounded p-4 space-y-3">
      {/* Main message */}
      <div className="flex items-start gap-2">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="w-4 h-4 text-destructive shrink-0 mt-0.5"
        >
          <circle cx="8" cy="8" r="7" />
          <path d="M8 5v3.5M8 11h.01" strokeLinecap="round" />
        </svg>
        <p className="text-sm font-medium text-destructive">{err.message}</p>
      </div>

      {/* Field-level validation errors */}
      {fieldEntries.length > 0 && (
        <ul className="ml-6 space-y-1">
          {fieldEntries.map(([field, messages]) =>
            messages.map((msg, i) => (
              <li key={`${field}-${i}`} className="text-xs text-destructive">
                <span className="font-mono bg-destructive/10 px-1 rounded mr-1">{field}</span>
                {msg}
              </li>
            ))
          )}
        </ul>
      )}

      {/* Dev-only: full server error details */}
      {isDev && err.devError && (
        <details className="mt-2">
          <summary className="text-xs font-mono text-destructive/70 cursor-pointer select-none hover:text-destructive">
            [DEV] Server error details
          </summary>
          <div className="mt-2 space-y-1.5 text-xs font-mono">
            {err.devError.name && (
              <div>
                <span className="text-muted">name: </span>
                <span className="text-destructive">{err.devError.name}</span>
              </div>
            )}
            {err.devError.code && (
              <div>
                <span className="text-muted">code: </span>
                <span className="text-destructive font-bold">{err.devError.code}</span>
                {err.devError.code === "P2002" && (
                  <span className="ml-2 text-warning">(unique constraint violation)</span>
                )}
                {err.devError.code === "P2003" && (
                  <span className="ml-2 text-warning">(foreign key constraint violation)</span>
                )}
                {err.devError.code === "P2025" && (
                  <span className="ml-2 text-warning">(record not found)</span>
                )}
              </div>
            )}
            {err.devError.meta !== undefined && (
              <div>
                <span className="text-muted">meta: </span>
                <span className="text-destructive">
                  {JSON.stringify(err.devError.meta)}
                </span>
              </div>
            )}
            <div>
              <span className="text-muted">message: </span>
              <span className="text-destructive">{err.devError.message}</span>
            </div>
            {err.devError.stack && (
              <details className="mt-1">
                <summary className="text-muted cursor-pointer hover:text-destructive">
                  stack trace
                </summary>
                <pre className="mt-1 p-2 bg-destructive/5 rounded text-[10px] overflow-x-auto whitespace-pre-wrap break-all text-destructive/80">
                  {err.devError.stack}
                </pre>
              </details>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
