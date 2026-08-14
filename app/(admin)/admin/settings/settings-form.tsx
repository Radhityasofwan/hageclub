"use client";

import { useState, useCallback, useRef } from "react";

interface SettingField {
  key: string;
  group: string;
  label: string;
  hint: string;
  isSecret: boolean;
  value: string;
  hasValue?: boolean;
  updatedAt: string;
}

interface Props {
  settings: SettingField[];
}

const GROUP_META: Record<string, { title: string; description: string; badge?: string }> = {
  analytics: {
    title: "Analytics & Tracking",
    description: "Google Analytics 4, Meta Pixel, Google Search Console — semua tracking terpusat dan mudah dikelola",
    badge: "GA4 · Meta · GSC",
  },
  whatsapp: {
    title: "WhatsApp Integration",
    description: "Nomor WhatsApp bisnis untuk customer communication dan floating chat button di halaman publik",
    badge: "WhatsApp API",
  },
};

// Keys that render an image upload widget instead of a text input
const IMAGE_UPLOAD_KEYS = new Set(["whatsapp_icon_url"]);

// Keys that render a structured template list editor
const TEMPLATE_LIST_KEYS = new Set(["whatsapp_message_templates"]);

export function SettingsForm({ settings }: Props) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map((s) => [s.key, s.value]))
  );
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleSaveGroup = async (group: string) => {
    setSaving(group);
    const groupSettings = settings.filter((s) => s.group === group);
    const updates = groupSettings.map((s) => ({ key: s.key, value: values[s.key] ?? "" }));

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Gagal menyimpan");
      showToast("success", data.message ?? "Settings tersimpan");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSaving(null);
    }
  };

  const handleImageUpload = async (key: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "File maksimal 5MB");
      return;
    }
    setUploading(key);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "settings");
      const res = await fetch("/api/admin/media/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Gagal upload");
      setValues((prev) => ({ ...prev, [key]: json.data.url }));
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Gagal upload");
    } finally {
      setUploading(null);
    }
  };

  // Layanan API (RajaOngkir, Komship, Pembayaran, QRISLY) masing-masing
  // dikelola di halaman settings-nya sendiri. Halaman ini hanya memegang
  // pengaturan non-API: Analytics & WhatsApp.
  const groups = ["analytics", "whatsapp"];

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-sm text-sm font-medium shadow-lg transition-all ${
            toast.type === "success"
              ? "bg-success text-white"
              : "bg-destructive text-white"
          }`}
        >
          {toast.type === "success" ? "✓" : "✕"} {toast.message}
        </div>
      )}

      {groups.map((group) => {
        const meta = GROUP_META[group];
        const groupFields = settings.filter((s) => s.group === group);
        if (!groupFields.length) return null;

        return (
          <section key={group} className="bg-white rounded-sm border border-border overflow-hidden">
            {/* Section header */}
            <div className="px-6 py-4 border-b border-border bg-accent/40 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold">{meta.title}</h2>
                  {meta.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-border rounded-sm text-muted tracking-wide">
                      {meta.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted mt-0.5">{meta.description}</p>
              </div>
            </div>

            {/* Fields */}
            <div className="divide-y divide-border">
              {groupFields.map((field) => {
                const isRevealed = revealed[field.key];
                const currentVal = values[field.key] ?? "";
                const isMasked = field.isSecret && currentVal === "••••••••";
                const isImageField = IMAGE_UPLOAD_KEYS.has(field.key);
                const isTemplateField = TEMPLATE_LIST_KEYS.has(field.key);

                return (
                  <div key={field.key} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <label htmlFor={field.key} className="text-sm font-medium text-primary">
                          {field.label}
                          {field.isSecret && (
                            <span className="ml-2 text-[10px] text-muted border border-border rounded-sm px-1 py-0.5 uppercase tracking-wide">
                              Secret
                            </span>
                          )}
                          {field.hasValue && (
                            <span className="ml-2 text-[10px] text-success border border-success/30 rounded-sm px-1 py-0.5 uppercase tracking-wide">
                              Set
                            </span>
                          )}
                        </label>
                        {field.hint && (
                          <p className="text-xs text-muted mt-0.5">{field.hint}</p>
                        )}
                      </div>
                    </div>

                    {isTemplateField ? (
                      <TemplateListEditor
                        value={currentVal}
                        onChange={(json) =>
                          setValues((prev) => ({ ...prev, [field.key]: json }))
                        }
                      />
                    ) : isImageField ? (
                      <ImageUploadField
                        fieldKey={field.key}
                        value={currentVal}
                        uploading={uploading === field.key}
                        onUpload={(file) => handleImageUpload(field.key, file)}
                        onClear={() => setValues((prev) => ({ ...prev, [field.key]: "" }))}
                      />
                    ) : (
                      <div className="relative">
                        <input
                          id={field.key}
                          type={field.isSecret && !isRevealed ? "password" : "text"}
                          value={currentVal}
                          onChange={(e) =>
                            setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                          }
                          placeholder={isMasked ? "Biarkan kosong untuk tidak mengubah" : "Masukkan nilai..."}
                          autoComplete="off"
                          spellCheck={false}
                          className="w-full h-9 border border-border rounded-sm px-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary pr-10 bg-white"
                        />
                        {field.isSecret && (
                          <button
                            type="button"
                            onClick={() =>
                              setRevealed((prev) => ({ ...prev, [field.key]: !isRevealed }))
                            }
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
                            aria-label={isRevealed ? "Hide" : "Show"}
                          >
                            {isRevealed ? <IconEyeOff /> : <IconEye />}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Section footer — Save button */}
            <div className="px-6 py-4 border-t border-border bg-accent/20 flex items-center justify-between">
              <p className="text-xs text-muted">
                Perubahan langsung aktif setelah disimpan (tidak perlu restart server)
              </p>
              <button
                onClick={() => handleSaveGroup(group)}
                disabled={saving === group}
                className="flex items-center gap-2 h-8 px-4 bg-primary text-white text-xs font-medium rounded-sm hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {saving === group ? (
                  <>
                    <span className="w-3 h-3 border border-white border-r-transparent rounded-full animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </button>
            </div>
          </section>
        );
      })}

      {/* Info box */}
      <div className="rounded-sm border border-border bg-white p-4 text-xs text-muted space-y-1.5">
        <p className="font-semibold text-primary">Catatan Keamanan</p>
        <p>• Secret key (API key, webhook secret) disimpan sebagai teks terenkripsi di database dan tidak pernah ditampilkan kembali setelah disimpan.</p>
        <p>• Nilai <code className="bg-accent px-1 rounded-sm">••••••••</code> berarti sudah ada nilai tersimpan — biarkan kosong jika tidak ingin mengubah.</p>
        <p>• Perubahan settings aktif dalam 5 menit (cache TTL). Untuk efek instan, restart aplikasi.</p>
      </div>
    </div>
  );
}

// ── Image upload widget ────────────────────────────────────────────────────────

interface ImageUploadFieldProps {
  fieldKey: string;
  value: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  onClear: () => void;
}

function ImageUploadField({ fieldKey, value, uploading, onUpload, onClear }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onUpload(file);
  }

  return (
    <div className="flex items-center gap-4">
      {/* Preview */}
      <div className="w-14 h-14 rounded-full bg-[#25D366] shrink-0 flex items-center justify-center overflow-hidden border border-border">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="WA icon preview" className="w-8 h-8 object-contain" />
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            id={fieldKey}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            className="hidden"
            onChange={handleChange}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 h-8 px-3 border border-border rounded-sm text-xs font-medium text-primary hover:bg-accent disabled:opacity-60 transition-colors"
          >
            {uploading ? (
              <>
                <span className="w-3 h-3 border border-primary border-r-transparent rounded-full animate-spin" />
                Mengupload...
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M8 11V3M4 6l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 13h12" strokeLinecap="round" />
                </svg>
                Upload Icon
              </>
            )}
          </button>
          {value && (
            <button
              type="button"
              onClick={onClear}
              className="h-8 px-3 border border-border rounded-sm text-xs text-muted hover:text-destructive hover:border-destructive/50 transition-colors"
            >
              Hapus
            </button>
          )}
        </div>
        {value ? (
          <p className="text-[11px] text-muted truncate font-mono">{value}</p>
        ) : (
          <p className="text-[11px] text-muted">Belum ada icon — pakai icon WhatsApp default</p>
        )}
      </div>
    </div>
  );
}

// ── Template list editor ──────────────────────────────────────────────────────

interface Template {
  label: string;
  message: string;
}

function TemplateListEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (json: string) => void;
}) {
  const [items, setItems] = useState<Template[]>(() => {
    try { return value ? (JSON.parse(value) as Template[]) : []; }
    catch { return []; }
  });

  function update(next: Template[]) {
    setItems(next);
    onChange(JSON.stringify(next));
  }

  function add() {
    update([...items, { label: "", message: "" }]);
  }

  function remove(i: number) {
    update(items.filter((_, idx) => idx !== i));
  }

  function change(i: number, field: keyof Template, val: string) {
    update(items.map((item, idx) => (idx === i ? { ...item, [field]: val } : item)));
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex gap-2 p-3 rounded-sm border border-border bg-accent/20 group"
        >
          <div className="flex-1 space-y-1.5 min-w-0">
            <input
              type="text"
              value={item.label}
              onChange={(e) => change(i, "label", e.target.value)}
              placeholder="Label tombol (cth: Tanya Produk)"
              className="w-full h-8 border border-border rounded-sm px-2.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary bg-white"
            />
            <textarea
              value={item.message}
              onChange={(e) => change(i, "message", e.target.value)}
              placeholder="Isi pesan yang dikirim ke WhatsApp..."
              rows={2}
              className="w-full border border-border rounded-sm px-2.5 py-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary bg-white leading-relaxed"
            />
          </div>
          <button
            type="button"
            onClick={() => remove(i)}
            aria-label="Hapus template"
            className="self-start mt-0.5 w-6 h-6 flex items-center justify-center rounded-sm text-muted opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M1 1l10 10M11 1L1 11" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1.5 h-8 px-3 border border-dashed border-border rounded-sm text-xs text-muted hover:text-primary hover:border-primary transition-colors"
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M5.5 1v9M1 5.5h9" strokeLinecap="round" />
        </svg>
        Tambah Template
      </button>

      {items.length === 0 && (
        <p className="text-xs text-muted italic">
          Tidak ada template — tombol WA akan langsung membuka chat.
        </p>
      )}
    </div>
  );
}

function IconEye() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 2l12 12M6.5 6.6A2 2 0 0010 9.5M4.6 4.7C2.8 5.9 1 8 1 8s2.5 5 7 5c1.3 0 2.5-.3 3.5-.9M10 3.4C9.4 3.2 8.7 3 8 3 3.5 3 1 8 1 8s.5 1 1.5 2" strokeLinecap="round" />
    </svg>
  );
}
