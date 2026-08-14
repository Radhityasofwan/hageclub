"use client";

import { useEffect, useState, useCallback } from "react";
import { SeoEditor } from "@/components/admin/seo-editor";

interface SeoSetting {
  id: string;
  page: string;
  seoTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
  robots: string | null;
  structuredData: Record<string, unknown> | null;
  updatedAt: string;
}

const DEFAULT_PAGES = [
  { value: "home", label: "Homepage" },
  { value: "products", label: "Products Catalog" },
  { value: "categories", label: "Category Pages" },
  { value: "about", label: "About Us" },
  { value: "contact", label: "Contact" },
  { value: "faq", label: "FAQ" },
  { value: "terms", label: "Terms & Conditions" },
  { value: "privacy", label: "Privacy Policy" },
];

export default function SeoPage() {
  const [settings, setSettings] = useState<SeoSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState<string>("home");

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/seo");
      const json = await res.json();
      if (json.success) setSettings(json.data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const currentSetting = settings.find((s) => s.page === selectedPage);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold">SEO Management</h1>
        <p className="text-sm text-muted">Manage meta tags and SEO settings for each page.</p>
      </div>

      <div className="grid grid-cols-[220px_1fr] gap-6">
        {/* Page list */}
        <div className="border border-border rounded bg-white divide-y divide-border h-fit">
          {DEFAULT_PAGES.map((p) => {
            const saved = settings.find((s) => s.page === p.value);
            return (
              <button
                key={p.value}
                onClick={() => setSelectedPage(p.value)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-accent/50 ${
                  selectedPage === p.value ? "bg-accent font-medium" : ""
                }`}
              >
                <span>{p.label}</span>
                {saved && (
                  <span className="ml-2 w-1.5 h-1.5 inline-block rounded-full bg-success" title="Has saved settings" />
                )}
              </button>
            );
          })}
        </div>

        {/* Editor */}
        <div className="bg-white border border-border rounded p-5">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-accent rounded w-48" />
              <div className="h-20 bg-accent rounded" />
              <div className="h-20 bg-accent rounded" />
            </div>
          ) : (
            <SeoEditor
              key={selectedPage}
              pagePath={selectedPage}
              initialData={currentSetting}
              onSaved={fetchSettings}
            />
          )}
        </div>
      </div>
    </div>
  );
}
