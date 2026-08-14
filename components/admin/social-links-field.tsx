"use client";

import { useState } from "react";
import { UploadField } from "@/components/admin/upload-field";
import { SocialIcon, type SocialLink } from "@/components/ui/social-icon";
import { cn } from "@/lib/utils";

const PLATFORMS: { value: string; label: string; hint: string }[] = [
  { value: "instagram", label: "Instagram",  hint: "https://instagram.com/username"  },
  { value: "tiktok",    label: "TikTok",     hint: "https://tiktok.com/@username"    },
  { value: "whatsapp",  label: "WhatsApp",   hint: "https://wa.me/6281234567890"     },
  { value: "email",     label: "Email",      hint: "mailto:hello@hageclub.com"       },
  { value: "youtube",   label: "YouTube",    hint: "https://youtube.com/@channel"    },
  { value: "twitter",   label: "Twitter / X",hint: "https://x.com/username"          },
  { value: "facebook",  label: "Facebook",   hint: "https://facebook.com/page"       },
  { value: "linkedin",  label: "LinkedIn",   hint: "https://linkedin.com/company/name"},
  { value: "shopee",    label: "Shopee",     hint: "https://shopee.co.id/store"      },
  { value: "tokopedia", label: "Tokopedia",  hint: "https://tokopedia.com/store"     },
  { value: "other",     label: "Lainnya",    hint: "https://"                        },
];

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

interface SocialLinksFieldProps {
  value: SocialLink[];
  onChange: (links: SocialLink[]) => void;
}

export function SocialLinksField({ value: links, onChange }: SocialLinksFieldProps) {
  function updateLink(id: string, updates: Partial<SocialLink>) {
    onChange(links.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  }

  function addLink() {
    onChange([...links, { id: makeId(), platform: "instagram", label: "", url: "", icon: null }]);
  }

  function removeLink(id: string) {
    onChange(links.filter((l) => l.id !== id));
  }

  function moveLink(id: string, dir: "up" | "down") {
    const idx = links.findIndex((l) => l.id === id);
    if (idx === -1) return;
    const newIdx = dir === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= links.length) return;
    const next = [...links];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    onChange(next);
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-primary">Tautan Sosial Media</h2>
          <p className="text-xs text-muted mt-0.5">
            Tampil di mobile menu dan sebagai fallback ikon sosial di footer (jika belum diatur di Pengaturan Footer).
          </p>
        </div>
        <button
          type="button"
          onClick={addLink}
          className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-primary hover:opacity-70 transition-opacity"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Tambah Link
        </button>
      </div>

      <div className="space-y-2">
        {links.length === 0 && (
          <div className="bg-white border border-border rounded px-5 py-10 text-center">
            <p className="text-sm text-muted">Belum ada tautan sosial media.</p>
            <button
              type="button"
              onClick={addLink}
              className="mt-2 text-sm text-primary hover:underline"
            >
              + Tambah link pertama
            </button>
          </div>
        )}

        {links.map((link, idx) => (
          <SocialLinkRow
            key={link.id}
            link={link}
            isFirst={idx === 0}
            isLast={idx === links.length - 1}
            onChange={(updates) => updateLink(link.id, updates)}
            onRemove={() => removeLink(link.id)}
            onMoveUp={() => moveLink(link.id, "up")}
            onMoveDown={() => moveLink(link.id, "down")}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Social Link Row ──────────────────────────────────────────────────────────

function SocialLinkRow({
  link,
  isFirst,
  isLast,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  link: SocialLink;
  isFirst: boolean;
  isLast: boolean;
  onChange: (updates: Partial<SocialLink>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [showIconEditor, setShowIconEditor] = useState(false);
  const hasCustomIcon = Boolean(link.icon);
  const urlHint = PLATFORMS.find((p) => p.value === link.platform)?.hint ?? "https://";

  return (
    <div className="bg-white border border-border rounded">
      {/* Main row — same flat layout as Footer > Terhubung */}
      <div className="flex items-center gap-2 px-2 py-2">
        {/* Icon square — shows active icon, click to open/close editor */}
        <button
          type="button"
          onClick={() => setShowIconEditor((v) => !v)}
          title={hasCustomIcon ? "Ikon kustom aktif — klik untuk ubah" : "Klik untuk upload ikon kustom"}
          className={cn(
            "shrink-0 w-9 h-9 flex items-center justify-center rounded border transition-colors",
            hasCustomIcon
              ? "border-primary bg-primary/5 text-primary"
              : showIconEditor
                ? "border-primary/40 bg-accent text-primary"
                : "border-border text-muted hover:border-primary/50 hover:text-primary"
          )}
        >
          {hasCustomIcon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={link.icon!} alt="" className="w-5 h-5 object-contain" />
          ) : (
            <span className="w-5 h-5">
              <SocialIcon platform={link.platform} icon={null} label={link.platform} />
            </span>
          )}
        </button>

        {/* Platform dropdown — proper bordered select like footer */}
        <select
          value={link.platform}
          onChange={(e) => onChange({ platform: e.target.value, icon: null })}
          className="h-9 border border-border rounded px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white w-36 shrink-0"
        >
          {PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

        {/* Label */}
        <input
          type="text"
          value={link.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Label (contoh: @hageclub)"
          className="flex-1 h-9 border border-border rounded px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white min-w-0"
        />

        {/* URL */}
        <input
          type="text"
          value={link.url}
          onChange={(e) => onChange({ url: e.target.value })}
          placeholder={urlHint}
          className="flex-[2] h-9 border border-border rounded px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white min-w-0"
        />

        {/* Reorder + delete */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            title="Pindah ke atas"
            className="p-1.5 rounded text-muted hover:text-primary disabled:opacity-25 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 10.5V3.5M4 6.5l3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            title="Pindah ke bawah"
            className="p-1.5 rounded text-muted hover:text-primary disabled:opacity-25 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 3.5v7M4 7.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onRemove}
            title="Hapus"
            className="p-1.5 rounded text-muted hover:text-red-600 transition-colors ml-0.5"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Collapsible icon editor */}
      {showIconEditor && (
        <div className="border-t border-border/60 bg-accent/20 px-3 pb-3 pt-3">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <UploadField
                value={link.icon ?? ""}
                onChange={(url) => onChange({ icon: url || null })}
                folder="brand"
                previewClassName="w-9 h-9"
                label="Ikon kustom"
                hint={
                  hasCustomIcon
                    ? "Gambar ini menimpa ikon platform bawaan. Klik Hapus untuk kembali ke ikon platform."
                    : "Opsional. Biarkan kosong untuk pakai ikon bawaan sesuai platform di atas."
                }
              />
            </div>
            {hasCustomIcon && (
              <button
                type="button"
                onClick={() => { onChange({ icon: null }); setShowIconEditor(false); }}
                className="mt-6 shrink-0 text-xs text-muted hover:text-primary transition-colors whitespace-nowrap"
              >
                ← Ikon bawaan
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
