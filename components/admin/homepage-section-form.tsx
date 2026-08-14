"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadField } from "@/components/admin/upload-field";
import { getSectionTypeLabel, getSectionPreview } from "@/components/homepage/section-renderer";

const SECTION_TYPES = [
  "hero",
  "catalog",
  "features",
  "brand_story",
  "testimonials",
  "banner",
  "stats",
];

interface ContentFields {
  [key: string]: {
    label: string;
    type: "text" | "textarea" | "url" | "number" | "switch" | "select" | "datetime" | "array" | "object";
    key: string;
    options?: { label: string; value: string }[];
    optionsFromUrl?: string;
    visibleWhen?: { key: string; value: string };
    fields?: ContentField[];
    placeholder?: string;
    hint?: string;
    folder?: string;
  };
}

interface ContentField {
  key: string;
  label: string;
  type: "text" | "textarea" | "url" | "number" | "switch";
  placeholder?: string;
  hint?: string;
  folder?: string;
}

const TYPE_CONTENT_FIELDS: Record<string, ContentFields> = {
  hero: {
    bgImage: { label: "Background Image", type: "url", key: "bgImage", folder: "hero", hint: "Gambar penuh layar — diskalakan memenuhi seluruh viewport (crop sisi agar tidak ada bar). Rekomendasi rasio 9:19.5 (mis. 1080×2340 px). Area tengah harus relatif bersih/gelap agar teks terbaca." },
    bgImages: {
      label: "Slider Images",
      type: "array",
      key: "bgImages",
      fields: [{ key: "url", label: "Image", type: "url", folder: "hero" }],
      hint: "1+ gambar = slider otomatis (fade tiap 5 detik) dengan panah navigasi. Background Image di atas ikut digabung sebagai slide terakhir (tidak dobel). Gambar memenuhi layar penuh — rekomendasi rasio 9:19.5 (mis. 1080×2340 px) agar crop minimal.",
    },
    // Primary CTA
    showCtaPrimary: { label: "Primary CTA Active", type: "switch", key: "showCtaPrimary" },
    ctaText: { label: "Primary CTA Text", type: "text", key: "ctaText", hint: "Kosongkan untuk memakai teks bawaan (Lihat Lebih Banyak / View More)." },
    ctaLink: { label: "Primary CTA Link", type: "text", key: "ctaLink" },
    // Secondary CTA
    showCtaSecondary: { label: "Secondary CTA Active", type: "switch", key: "showCtaSecondary" },
    ctaSecondaryText: { label: "Secondary CTA Text", type: "text", key: "ctaSecondaryText" },
    ctaSecondaryLink: { label: "Secondary CTA Link", type: "text", key: "ctaSecondaryLink" },
  },
  catalog: {
    template: {
      label: "Template Layout",
      type: "select",
      key: "template",
      options: [
        { label: "Product Grid", value: "grid" },
        { label: "Featured Product (Full Screen)", value: "featured" },
      ],
      hint: "Grid: katalog standar. Featured: 1 produk unggulan full screen dengan countdown promo.",
    },
    sectionTitle: { label: "Section Title", type: "text", key: "sectionTitle", placeholder: "All Products" },
    // Fields khusus template Product Grid
    productCount: { label: "Product Count", type: "number", key: "productCount", visibleWhen: { key: "template", value: "grid" } },
    sortBy: {
      label: "Default Sort",
      type: "select",
      key: "sortBy",
      visibleWhen: { key: "template", value: "grid" },
      options: [
        { label: "Newest", value: "newest" },
        { label: "Price: Low to High", value: "price_asc" },
        { label: "Price: High to Low", value: "price_desc" },
      ],
    },
    showSortDropdown: { label: "Show Sort Dropdown", type: "switch", key: "showSortDropdown", visibleWhen: { key: "template", value: "grid" } },
    showViewAll: { label: "Show View All Link", type: "switch", key: "showViewAll", visibleWhen: { key: "template", value: "grid" } },
    viewAllLinkText: { label: "View All Link Text", type: "text", key: "viewAllLinkText", placeholder: "View Full Collection", visibleWhen: { key: "template", value: "grid" } },
    viewAllLink: { label: "View All Link URL", type: "text", key: "viewAllLink", placeholder: "/shop", visibleWhen: { key: "template", value: "grid" } },
    // Fields khusus template Featured Product
    featuredProductId: {
      label: "Featured Product",
      type: "select",
      key: "featuredProductId",
      optionsFromUrl: "/api/admin/products?limit=50",
      visibleWhen: { key: "template", value: "featured" },
      hint: "Foto cover produk dipakai sebagai visual full screen (memenuhi layar, tanpa bar). Rekomendasi rasio 9:19.5 (mis. 1080×2340 px) agar crop minimal.",
    },
    // Countdown berlaku untuk kedua template: featured (di dalam gambar) dan grid (di atas section title)
    showCountdown: {
      label: "Show Countdown Timer",
      type: "switch",
      key: "showCountdown",
      hint: "Featured: di dalam gambar. Grid: di atas judul section.",
    },
    campaignTitle: {
      label: "Campaign Title",
      type: "text",
      key: "campaignTitle",
      placeholder: "Flash Sale Akhir Bulan",
    },
    campaignEndDate: {
      label: "Campaign End Date (WIB)",
      type: "datetime",
      key: "campaignEndDate",
      hint: "Waktu WIB (Jakarta). Disimpan dalam format UTC.",
    },
  },
  features: {
    columns: {
      label: "Feature Columns",
      type: "array",
      key: "columns",
      fields: [
        { key: "icon", label: "Icon", type: "text", placeholder: "truck, shield, refresh, heart, tag, star, box, message" },
        { key: "title", label: "Title", type: "text" },
        { key: "description", label: "Description", type: "textarea" },
      ],
    },
  },
  brand_story: {
    image: { label: "Image", type: "url", key: "image", folder: "brand_story" },
    body: { label: "Story Body Text", type: "textarea", key: "body" },
    ctaText: { label: "CTA Button Text", type: "text", key: "ctaText" },
    ctaLink: { label: "CTA Button Link", type: "text", key: "ctaLink" },
    imagePosition: {
      label: "Image Position",
      type: "select",
      key: "imagePosition",
      options: [
        { label: "Left", value: "left" },
        { label: "Right", value: "right" },
      ],
    },
  },
  testimonials: {
    items: {
      label: "Testimonial Items",
      type: "array",
      key: "items",
      fields: [
        { key: "name", label: "Name", type: "text" },
        { key: "role", label: "Role/Location", type: "text" },
        { key: "avatar", label: "Avatar", type: "url", folder: "testimonials" },
        { key: "quote", label: "Quote", type: "textarea" },
      ],
    },
  },
  banner: {
    bgImage: { label: "Background Image", type: "url", key: "bgImage", folder: "banner" },
    bgColor: { label: "Background Color (CSS)", type: "text", key: "bgColor", placeholder: "bg-primary / #1a1a2e" },
    text: { label: "Banner Text", type: "textarea", key: "text" },
    ctaText: { label: "CTA Button Text", type: "text", key: "ctaText" },
    ctaLink: { label: "CTA Button Link", type: "text", key: "ctaLink" },
    textDark: { label: "Dark Text (for light backgrounds)", type: "switch", key: "textDark" },
  },
  stats: {
    items: {
      label: "Stat Items",
      type: "array",
      key: "items",
      fields: [
        { key: "value", label: "Value (e.g. 500+)", type: "text" },
        { key: "label", label: "Label (e.g. Products)", type: "text" },
      ],
    },
    columns: {
      label: "Columns",
      type: "number",
      key: "columns",
    },
  },
};

interface HomepageSectionData {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  content: Record<string, unknown>;
  sortOrder: number;
  active: boolean;
}

/** Convert ISO string to datetime-local value (WIB = UTC+7) */
function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const wib = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().slice(0, 16);
}

/** Convert datetime-local value back to ISO string (WIB → UTC) */
function datetimeLocalToIso(val: string): string {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return new Date(d.getTime() - 7 * 60 * 60 * 1000).toISOString();
}

interface Props {
  section?: HomepageSectionData | null;
  onSave: (data: {
    type: string;
    title: string;
    subtitle: string;
    content: Record<string, unknown>;
    active: boolean;
  }) => void;
  onClose: () => void;
  saving: boolean;
}

interface RemoteOption {
  label: string;
  value: string;
}

/**
 * Select yang mengambil options dari API admin (mis. daftar produk).
 * Value tersimpan yang tidak ada di list tetap ditampilkan agar tidak hilang saat edit.
 */
function RemoteSelect({
  value,
  onChange,
  url,
  placeholder = "Pilih...",
}: {
  value: string;
  onChange: (value: string) => void;
  url: string;
  placeholder?: string;
}) {
  const [options, setOptions] = useState<RemoteOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        const list = (json?.data?.products as { id: string; name: string }[] | undefined) ?? [];
        setOptions(list.map((p) => ({ label: p.name, value: p.id })));
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  const storedValueMissing = value && !options.some((o) => o.value === value);

  return (
    <div className="space-y-1.5">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 text-sm border border-border rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="">{loading ? "Memuat..." : placeholder}</option>
        {storedValueMissing && <option value={value}>{value}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {storedValueMissing && (
        <p className="text-[10px] text-amber-600">
          Produk terpilih tidak ada dalam daftar (mungkin sudah dihapus). Pilih ulang untuk menghindari nilai usang.
        </p>
      )}
    </div>
  );
}

function ArrayFieldEditor({
  fields,
  items,
  onChange,
}: {
  fields: ContentField[];
  items: Record<string, string>[];
  onChange: (items: Record<string, string>[]) => void;
}) {
  function updateItem(index: number, key: string, value: string) {
    const next = items.map((item, i) =>
      i === index ? { ...item, [key]: value } : item
    );
    onChange(next);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function addItem() {
    onChange([...items, {}]);
  }

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="p-4 bg-accent/30 border border-border rounded space-y-3 relative">
          <button
            type="button"
            onClick={() => removeItem(i)}
            className="absolute top-2 right-2 text-muted hover:text-red-500 transition-colors"
            title="Remove"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <p className="text-xs font-medium text-muted">Item {i + 1}</p>
          {fields.map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-medium text-muted mb-1">{field.label}</label>
              {field.type === "url" ? (
                <UploadField
                  value={item[field.key] ?? ""}
                  onChange={(url) => updateItem(i, field.key, url)}
                  folder={field.folder}
                  vertical
                  previewClassName="w-full h-20"
                />
              ) : field.type === "textarea" ? (
                <textarea
                  value={item[field.key] ?? ""}
                  onChange={(e) => updateItem(i, field.key, e.target.value)}
                  className="w-full h-20 px-3 py-2 text-sm border border-border rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder={field.placeholder}
                />
              ) : (
                <input
                  type="text"
                  value={item[field.key] ?? ""}
                  onChange={(e) => updateItem(i, field.key, e.target.value)}
                  className="w-full h-9 px-3 text-sm border border-border rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder={field.placeholder}
                />
              )}
              {field.hint && <p className="text-[10px] text-muted mt-0.5">{field.hint}</p>}
            </div>
          ))}
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="text-xs text-muted hover:text-primary transition-colors flex items-center gap-1"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Add Item
      </button>
    </div>
  );
}

export function HomepageSectionForm({ section, onSave, onClose, saving }: Props) {
  const isEditing = !!section;
  const [type, setType] = useState(section?.type ?? "hero");
  const [title, setTitle] = useState(section?.title ?? "");
  const [subtitle, setSubtitle] = useState(section?.subtitle ?? "");
  const [active, setActive] = useState(section?.active ?? true);
  const [content, setContent] = useState<Record<string, unknown>>(
    (section?.content as Record<string, unknown>) ?? {}
  );
  const [preview, setPreview] = useState("");

  useEffect(() => {
    setPreview(getSectionPreview(type));
  }, [type]);

  function updateContentField(fieldDef: ContentFields[string], value: unknown) {
    setContent((prev) => ({ ...prev, [fieldDef.key]: value }));
  }

  function getContentValue(key: string): unknown {
    return content[key];
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ type, title, subtitle, content, active });
  }

  const fields = TYPE_CONTENT_FIELDS[type] ?? {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-primary">
            {isEditing ? "Edit Section" : "Add Section"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-primary transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M14 4L4 14M4 4l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Type selector (only when creating) */}
          {!isEditing && (
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                Section Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SECTION_TYPES.map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setType(t)}
                    className={`px-3 py-2 text-xs rounded border text-left transition-colors ${
                      type === t
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-border text-muted hover:border-primary/30"
                    }`}
                  >
                    {getSectionTypeLabel(t)}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted mt-2">{preview}</p>
            </div>
          )}

          {/* Type display (editing) */}
          {isEditing && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">Type:</span>
              <span className="text-xs font-medium text-primary bg-primary/5 px-2 py-1 rounded">
                {getSectionTypeLabel(type)}
              </span>
            </div>
          )}

          {/* Title */}
          <Input
            label="Section Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title displayed above the section"
          />

          {/* Subtitle */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              Subtitle / Tagline
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full h-10 px-3 text-sm border border-border rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              placeholder="Subtitle or tagline"
            />
          </div>

          {/* Type-specific content fields */}
          {Object.entries(fields)
            .filter(([, fieldDef]) => {
              if (!fieldDef.visibleWhen) return true;
              // template kosong/undefined = default grid
              const current = getContentValue(fieldDef.visibleWhen.key);
              return String(current ?? "") === fieldDef.visibleWhen.value;
            })
            .map(([fieldKey, fieldDef]) => (
            <div key={fieldKey}>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                {fieldDef.label}
              </label>

              {/* Array type */}
              {fieldDef.type === "array" && fieldDef.fields && (
                <ArrayFieldEditor
                  fields={fieldDef.fields}
                  items={(getContentValue(fieldDef.key) as Record<string, string>[]) ?? []}
                  onChange={(items) => updateContentField(fieldDef, items)}
                />
              )}

              {/* Switch type */}
              {fieldDef.type === "switch" && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={Boolean(getContentValue(fieldDef.key))}
                      onChange={(e) => updateContentField(fieldDef, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-accent rounded-full peer-checked:bg-primary transition-colors" />
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform" />
                  </div>
                  <span className="text-xs text-muted">{fieldDef.label}</span>
                </label>
              )}

              {/* Select type */}
              {fieldDef.type === "select" && fieldDef.optionsFromUrl && (
                <RemoteSelect
                  value={(getContentValue(fieldDef.key) as string) ?? ""}
                  onChange={(val) => updateContentField(fieldDef, val)}
                  url={fieldDef.optionsFromUrl}
                />
              )}

              {fieldDef.type === "select" && fieldDef.options && (
                <select
                  value={(getContentValue(fieldDef.key) as string) ?? ""}
                  onChange={(e) => updateContentField(fieldDef, e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-border rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Default</option>
                  {fieldDef.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}

              {/* Datetime type — WIB (UTC+7) */}
              {fieldDef.type === "datetime" && (
                <input
                  type="datetime-local"
                  value={isoToDatetimeLocal(getContentValue(fieldDef.key) as string)}
                  onChange={(e) => updateContentField(fieldDef, datetimeLocalToIso(e.target.value))}
                  className="w-full h-10 px-3 text-sm border border-border rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
              )}

              {/* Upload type */}
              {fieldDef.type === "url" && (
                <UploadField
                  value={(getContentValue(fieldDef.key) as string) ?? ""}
                  onChange={(url) => updateContentField(fieldDef, url)}
                  folder={fieldDef.folder}
                  vertical
                  previewClassName="w-full h-32"
                />
              )}

              {/* Textarea */}
              {fieldDef.type === "textarea" && (
                <textarea
                  value={(getContentValue(fieldDef.key) as string) ?? ""}
                  onChange={(e) => updateContentField(fieldDef, e.target.value)}
                  className="w-full h-24 px-3 py-2 text-sm border border-border rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                  placeholder={fieldDef.placeholder}
                />
              )}

              {/* Text/Number/URL input */}
              {fieldDef.type === "text" && (
                <input
                  type="text"
                  value={(getContentValue(fieldDef.key) as string) ?? ""}
                  onChange={(e) => updateContentField(fieldDef, e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-border rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder={fieldDef.placeholder}
                />
              )}

              {fieldDef.type === "number" && (
                <input
                  type="number"
                  value={(getContentValue(fieldDef.key) as number | string) ?? ""}
                  onChange={(e) =>
                    updateContentField(fieldDef, e.target.value ? Number(e.target.value) : "")
                  }
                  className="w-full h-10 px-3 text-sm border border-border rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder={fieldDef.placeholder}
                />
              )}

              {fieldDef.hint && (
                <p className="text-[10px] text-muted mt-1">{fieldDef.hint}</p>
              )}
            </div>
          ))}

          {/* Active toggle */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
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
                <p className="text-xs font-medium">Active</p>
                <p className="text-[10px] text-muted">Hide/show this section on the homepage</p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {isEditing ? "Save Changes" : "Add Section"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
