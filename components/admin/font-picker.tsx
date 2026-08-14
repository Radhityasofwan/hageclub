"use client";

import { useState, useRef, useEffect } from "react";
import { DISPLAY_FONTS, BODY_FONTS, DEFAULT_DISPLAY_FONT, DEFAULT_BODY_FONT } from "@/lib/brand-fonts";
import type { FontOption } from "@/lib/brand-fonts";

interface Props {
  initialDisplay: string;
  initialBody: string;
}

export function FontPicker({ initialDisplay, initialBody }: Props) {
  const [display, setDisplay] = useState(initialDisplay || DEFAULT_DISPLAY_FONT);
  const [body, setBody]       = useState(initialBody    || DEFAULT_BODY_FONT);
  const [saving, setSaving]   = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const displayFont = DISPLAY_FONTS.find(f => f.id === display) ?? DISPLAY_FONTS[0];
  const bodyFont    = BODY_FONTS.find(f => f.id === body)        ?? BODY_FONTS[0];

  const previewHeadingStyle: React.CSSProperties = {
    fontFamily: `var(${displayFont.cssVar})`,
    fontWeight: displayFont.headingWeight,
    letterSpacing: displayFont.headingTracking,
  };

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_font_display: display, brand_font_body: body }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: json.message ?? "Gagal menyimpan" });
        return;
      }
      setMessage({ type: "success", text: "Tipografi berhasil disimpan" });
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan, coba lagi" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-primary mb-1">Tipografi</h2>
        <p className="text-xs text-muted">
          Pilih font primer untuk heading dan font sekunder untuk body. Sistem otomatis menerapkannya ke seluruh halaman.
        </p>
      </div>

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

      {/* Live preview */}
      <div className="bg-primary rounded p-6 sm:p-8">
        <p className="text-[10px] tracking-[0.2em] uppercase text-white/30 mb-5">Preview</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
          <div>
            <h3
              className="text-4xl sm:text-5xl text-white leading-none mb-3"
              style={previewHeadingStyle}
            >
              HAGE CLUB
            </h3>
            <p
              className="text-xs tracking-[0.18em] uppercase text-white/40"
              style={{ fontFamily: `var(${displayFont.cssVar})` }}
            >
              Refined Comfort
            </p>
          </div>
          <div className="sm:border-l sm:border-white/10 sm:pl-8">
            <p
              className="text-sm font-semibold text-white mb-2"
              style={{ fontFamily: `var(${bodyFont.cssVar})` }}
            >
              Polo Rhinestone Series
            </p>
            <p
              className="text-xs leading-relaxed text-white/50"
              style={{ fontFamily: `var(${bodyFont.cssVar})` }}
            >
              Craftsmanship dalam setiap detail. Dirancang untuk mereka yang hidup dengan passion dan tetap membumi.
            </p>
            <p
              className="text-base font-bold text-white mt-3"
              style={{ fontFamily: `var(${bodyFont.cssVar})` }}
            >
              Rp 425.000
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-white/10">
          <span className="flex items-center gap-1.5 text-[10px] text-white/40">
            <span className="w-1.5 h-1.5 rounded-full bg-white/70 inline-block" />
            Primer — {displayFont.name}
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-white/40">
            <span className="w-1.5 h-1.5 rounded-full bg-white/30 inline-block" />
            Sekunder — {bodyFont.name}
          </span>
        </div>
      </div>

      {/* Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FontDropdown
          label="Font Primer"
          badge="Heading"
          badgeClass="bg-primary text-white"
          desc="H1 – H6, judul section"
          fonts={DISPLAY_FONTS}
          selected={display}
          onSelect={setDisplay}
        />
        <FontDropdown
          label="Font Sekunder"
          badge="Body"
          badgeClass="bg-accent text-primary"
          desc="Teks, tombol, label, form"
          fonts={BODY_FONTS}
          selected={body}
          onSelect={setBody}
        />
      </div>

      {/* Save row */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted">
          <span className="font-medium text-primary">{displayFont.name}</span>
          <span className="mx-1.5 opacity-40">+</span>
          <span className="font-medium text-primary">{bodyFont.name}</span>
        </p>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center px-5 py-2 text-sm font-medium text-white bg-primary rounded hover:opacity-85 disabled:opacity-40 transition-opacity"
        >
          {saving ? "Menyimpan…" : "Simpan Tipografi"}
        </button>
      </div>
    </div>
  );
}

// ── Custom font dropdown ──────────────────────────────────────────────────────

function FontDropdown({
  label, badge, badgeClass, desc, fonts, selected, onSelect,
}: {
  label: string;
  badge: string;
  badgeClass: string;
  desc: string;
  fonts: FontOption[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedFont = fonts.find(f => f.id === selected) ?? fonts[0];

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  return (
    <div>
      {/* Column header */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[9px] font-bold tracking-[0.1em] uppercase px-1.5 py-0.5 rounded ${badgeClass}`}>
          {badge}
        </span>
        <span className="text-xs font-semibold text-primary">{label}</span>
        <span className="text-[11px] text-muted ml-auto">{desc}</span>
      </div>

      <div ref={ref} className="relative">
        {/* Trigger */}
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-border rounded text-left hover:border-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
        >
          <span
            aria-hidden="true"
            className="text-[22px] leading-none shrink-0 text-primary"
            style={{
              fontFamily: `var(${selectedFont.cssVar})`,
              fontWeight: selectedFont.headingWeight,
              letterSpacing: selectedFont.role === "display" ? selectedFont.headingTracking : undefined,
            }}
          >
            Ag
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primary leading-tight truncate">
              {selectedFont.name}
            </p>
            <p className="text-[11px] text-muted truncate">{selectedFont.desc}</p>
          </div>
          <svg
            width="14" height="14" viewBox="0 0 14 14" fill="none"
            aria-hidden="true"
            className={`shrink-0 text-muted transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          >
            <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Panel */}
        {open && (
          <div
            role="listbox"
            className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-border rounded shadow-lg overflow-hidden"
          >
            <div className="max-h-[264px] overflow-y-auto scrollbar-hide">
              {fonts.map(font => {
                const isActive = font.id === selected;
                return (
                  <button
                    key={font.id}
                    role="option"
                    aria-selected={isActive}
                    type="button"
                    onClick={() => { onSelect(font.id); setOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      isActive ? "bg-accent/70" : "hover:bg-accent/30"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="text-lg leading-none shrink-0 w-7 text-right text-primary/80"
                      style={{
                        fontFamily: `var(${font.cssVar})`,
                        fontWeight: font.headingWeight,
                        letterSpacing: font.role === "display" ? font.headingTracking : undefined,
                      }}
                    >
                      Ag
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium leading-tight ${isActive ? "text-primary" : "text-primary/80"}`}>
                        {font.name}
                      </p>
                      <p className="text-[11px] text-muted">{font.desc}</p>
                    </div>
                    {isActive && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="shrink-0 text-primary">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
