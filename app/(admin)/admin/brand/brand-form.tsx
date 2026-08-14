"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UploadField } from "@/components/admin/upload-field";

interface Props {
  initialValues: Record<string, string>;
}

export function BrandForm({ initialValues }: Props) {
  const [logoUrl, setLogoUrl] = useState(initialValues.brand_logo ?? "");
  const [faviconUrl, setFaviconUrl] = useState(initialValues.brand_favicon ?? "");
  const [uploading, setUploading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 40 * 1024 * 1024) {
      setMessage({ type: "error", text: "Logo maksimal 40MB" });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "brand");

      const res = await fetch("/api/admin/media/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: json.message ?? "Gagal upload logo" });
        return;
      }
      setLogoUrl(json.data.url);
      setMessage({ type: "success", text: "Logo berhasil diupload" });
    } catch {
      setMessage({ type: "error", text: "Gagal upload logo" });
    } finally {
      setUploading(false);
      // Reset file input so same file can be re-selected
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        brand_logo: logoUrl || null,
        brand_favicon: faviconUrl || null,
      };

      const res = await fetch("/api/admin/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: json.message ?? "Gagal menyimpan" });
        return;
      }
      setMessage({ type: "success", text: "Pengaturan brand berhasil disimpan" });
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan, coba lagi" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {message && (
        <div
          className={`px-4 py-3 rounded text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Logo Brand */}
      <div>
        <h2 className="text-sm font-semibold text-primary mb-1">Logo Brand</h2>
        <p className="text-xs text-muted mb-3">
          Upload logo brand yang tampil di navbar. Gunakan logo berwarna putih untuk background gelap.
        </p>
        <div className="bg-white border border-border rounded p-5">
          {logoUrl ? (
            <div className="flex items-start gap-4">
              <div className="w-32 h-12 bg-primary rounded flex items-center justify-center p-2 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted font-mono truncate mb-2">{logoUrl}</p>
                <div className="flex gap-2">
                  <label className="inline-flex items-center gap-1.5 text-xs font-medium text-primary cursor-pointer hover:opacity-70 transition-opacity">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    Ganti Logo
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setLogoUrl("")}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:opacity-70 transition-opacity"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded p-8 text-center">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="mx-auto mb-2 text-muted/50">
                <rect x="4" y="8" width="24" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="11" cy="14" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4 22l7-5 4 3.5L19 17l9 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-sm text-muted mb-3">Belum ada logo brand</p>
              <label>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 bg-primary text-white rounded cursor-pointer hover:opacity-90 transition-opacity">
                  {uploading ? "Mengupload..." : "Upload Logo"}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                  className="hidden"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          )}
          {uploading && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted">
              <span className="w-3 h-3 border border-muted border-t-transparent rounded-full animate-spin" />
              Mengupload logo...
            </div>
          )}
        </div>
      </div>

      {/* Favicon */}
      <div>
        <h2 className="text-sm font-semibold text-primary mb-1">Favicon (Ikon Tab Browser)</h2>
        <p className="text-xs text-muted mb-3">
          Ikon kecil yang tampil di tab browser dan bookmark.
        </p>
        <div className="bg-white border border-border rounded p-5">
          <UploadField
            value={faviconUrl}
            onChange={setFaviconUrl}
            label="Favicon"
            hint="Rasio kotak 1:1 — ideal 512×512 px (browser menskalakan otomatis). PNG atau SVG paling aman untuk semua browser."
            folder="brand"
            previewClassName="w-12 h-12"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={saving}>
          Simpan Perubahan
        </Button>
      </div>
    </form>
  );
}
