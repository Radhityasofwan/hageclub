"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { UploadField } from "@/components/admin/upload-field";

interface SeoData {
  seoTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
  robots: string | null;
  structuredData: Record<string, unknown> | null;
}

interface SeoEditorProps {
  pagePath: string;
  initialData?: SeoData | null;
  onSaved?: () => void;
}

export function SeoEditor({ pagePath, initialData, onSaved }: SeoEditorProps) {
  const [form, setForm] = useState<SeoData>({
    seoTitle: initialData?.seoTitle ?? "",
    metaDescription: initialData?.metaDescription ?? "",
    ogImage: initialData?.ogImage ?? "",
    canonicalUrl: initialData?.canonicalUrl ?? "",
    robots: initialData?.robots ?? "",
    structuredData: initialData?.structuredData ?? null,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setForm({
        seoTitle: initialData.seoTitle ?? "",
        metaDescription: initialData.metaDescription ?? "",
        ogImage: initialData.ogImage ?? "",
        canonicalUrl: initialData.canonicalUrl ?? "",
        robots: initialData.robots ?? "",
        structuredData: initialData.structuredData ?? null,
      });
    }
  }, [initialData]);

  function update(field: keyof SeoData, value: string | Record<string, unknown> | null) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/seo/${encodeURIComponent(pagePath)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seoTitle: form.seoTitle || null,
          metaDescription: form.metaDescription || null,
          ogImage: form.ogImage || null,
          canonicalUrl: form.canonicalUrl || null,
          robots: form.robots || null,
          structuredData: form.structuredData || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "Failed to save");
        return;
      }

      onSaved?.();
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <Input
        label="SEO Title"
        value={form.seoTitle ?? ""}
        onChange={(e) => update("seoTitle", e.target.value)}
        placeholder="Title tag for this page"
        maxLength={70}
      />

      <Textarea
        label="Meta Description"
        value={form.metaDescription ?? ""}
        onChange={(e) => update("metaDescription", e.target.value)}
        placeholder="Brief description for search results"
        rows={3}
        maxLength={160}
      />

      <UploadField
        value={form.ogImage ?? ""}
        onChange={(url) => update("ogImage", url)}
        label="OG Image"
        hint="Open Graph image shared on social media"
        folder="seo"
        previewClassName="w-full h-32"
      />

      <Input
        label="Canonical URL"
        value={form.canonicalUrl ?? ""}
        onChange={(e) => update("canonicalUrl", e.target.value)}
        placeholder="https://hageclub.com/page"
      />

      <Input
        label="Robots Directive"
        value={form.robots ?? ""}
        onChange={(e) => update("robots", e.target.value)}
        placeholder="index, follow"
      />

      <Textarea
        label="Structured Data (JSON-LD)"
        value={form.structuredData ? JSON.stringify(form.structuredData, null, 2) : ""}
        onChange={(e) => {
          try {
            const parsed = JSON.parse(e.target.value);
            update("structuredData", parsed);
          } catch {
            // may be invalid JSON while typing — don't clear
          }
        }}
        placeholder='{"@context": "https://schema.org", ...}'
        rows={6}
      />

      <div className="flex justify-end">
        <Button type="submit" loading={saving}>
          Save SEO Settings
        </Button>
      </div>
    </form>
  );
}
