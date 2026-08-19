"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface UploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  folder?: string;
  previewClassName?: string;
  previewBg?: "light" | "dark";
  /** Layout vertikal: preview di atas, tombol aksi di bawah (tidak melebar). */
  vertical?: boolean;
}

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml";

export function UploadField({
  value,
  onChange,
  label,
  hint,
  folder = "uploads",
  previewClassName,
  previewBg = "light",
  vertical = false,
}: UploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > 40 * 1024 * 1024) {
      setError("File maksimal 40MB");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/admin/media/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "Gagal upload");
        return;
      }
      onChange(json.data.url);
    } catch {
      setError("Gagal upload, coba lagi");
    } finally {
      setUploading(false);
    }
  }

  const boxClass = cn(
    "p-3 rounded border",
    previewBg === "dark" ? "bg-primary border-white/10" : "bg-white border-border"
  );

  const actionButtons = (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="text-xs font-medium text-primary hover:opacity-70 transition-opacity"
      >
        Ganti Gambar
      </button>
      <span className="text-muted/40">•</span>
      <button
        type="button"
        onClick={() => onChange("")}
        className="text-xs font-medium text-red-600 hover:opacity-70 transition-opacity"
      >
        Hapus
      </button>
      <span className="text-muted/40">•</span>
      <button
        type="button"
        onClick={() => setShowUrl((v) => !v)}
        className="text-xs text-muted hover:text-primary transition-colors"
      >
        {showUrl ? "Tutup URL" : "Pakai URL"}
      </button>
    </div>
  );

  const uploadButton = (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={uploading}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded transition-colors",
        previewBg === "dark"
          ? "bg-white/10 text-white hover:bg-white/20"
          : "bg-accent text-primary hover:bg-accent/70"
      )}
    >
      {uploading ? (
        <>
          <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          Uploading...
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v8M2.5 4.5L6 1l3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M1 9v2h10V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          Upload Gambar
        </>
      )}
    </button>
  );

  return (
    <div className="space-y-2">
      {label && <label className="block text-xs font-medium text-muted">{label}</label>}

      {vertical ? (
        <div className={boxClass}>
          {value ? (
            <div className="space-y-3">
              {/* Preview di atas */}
              <div
                className={cn(
                  "relative overflow-hidden rounded bg-accent/40 flex items-center justify-center",
                  previewClassName ?? "w-full h-28"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={value}
                  alt={label ?? "Preview"}
                  className="w-full h-full object-contain"
                />
              </div>
              {/* Tombol aksi di bawah preview */}
              {actionButtons}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className={cn(
                "w-full inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2.5 rounded transition-colors border-2 border-dashed",
                previewBg === "dark"
                  ? "border-white/20 text-white hover:bg-white/10"
                  : "border-border text-primary hover:border-primary/40 hover:bg-accent/40"
              )}
            >
              {uploading ? (
                <>
                  <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1v8M2.5 4.5L6 1l3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M1 9v2h10V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                  Upload Gambar
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        <div className={cn("flex items-center gap-3 p-3 rounded border", previewBg === "dark" ? "bg-primary border-white/10" : "bg-white border-border")}>
          {/* Preview */}
          {value ? (
            <div
              className={cn(
                "relative shrink-0 overflow-hidden rounded bg-accent/40 flex items-center justify-center",
                previewClassName ?? "w-16 h-12"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt={label ?? "Preview"}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div
              className={cn(
                "shrink-0 flex items-center justify-center text-muted/40 rounded bg-accent/40",
                previewClassName ?? "w-16 h-12"
              )}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="1" y="3" width="16" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="6" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M1 12.5l4.5-3 2.5 2 3-3.5 6 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}

          {/* Actions */}
          <div className="flex-1 min-w-0">
            {value ? actionButtons : uploadButton}
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={handleUpload}
        disabled={uploading}
      />

      {/* URL paste fallback */}
      {showUrl && (
        <div className="flex gap-2">
          <input
            type="url"
            value={value.startsWith("data:") ? "" : value}
            onChange={(e) => {
              const v = e.target.value;
              if (v.startsWith("data:image") && v.length > 100 * 1024) {
                setError("Data URL terlalu besar — upload via tombol Upload");
                return;
              }
              setError(null);
              onChange(v);
            }}
            placeholder="https://res.cloudinary.com/..."
            className="flex-1 h-8 px-2.5 text-xs border border-border rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowUrl(false)}
            className="shrink-0 px-2 text-xs text-muted hover:text-primary"
          >
            Selesai
          </button>
        </div>
      )}

      {error && <p className="text-[11px] text-red-600">{error}</p>}
      {hint && !error && <p className="text-[10px] text-muted">{hint}</p>}
    </div>
  );
}
