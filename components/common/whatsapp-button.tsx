"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/client";

const KEYFRAMES = `
  @keyframes wa-panel-in {
    0%   { opacity: 0; transform: scale(0.80) translateY(14px); }
    65%  { transform: scale(1.03) translateY(-2px); }
    100% { opacity: 1; transform: scale(1)    translateY(0); }
  }
  @keyframes wa-panel-out {
    0%   { opacity: 1; transform: scale(1)    translateY(0); }
    100% { opacity: 0; transform: scale(0.84) translateY(10px); }
  }
  @keyframes wa-item-in {
    0%   { opacity: 0; transform: translateY(6px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .wa-panel-in  { animation: wa-panel-in  0.36s cubic-bezier(0.34, 1.46, 0.64, 1) forwards; transform-origin: bottom right; }
  .wa-panel-out { animation: wa-panel-out 0.18s cubic-bezier(0.4, 0, 1, 1)          forwards; transform-origin: bottom right; }
  .wa-item-in   { animation: wa-item-in   0.24s cubic-bezier(0.25, 1, 0.5, 1)       both; }
`;

export interface MessageTemplate {
  label: string;
  message: string;
}

interface Props {
  number: string | null;
  iconUrl?: string | null;
  templates?: MessageTemplate[];
  /** Varian kecil untuk diletakkan di samping Floating Cart Alert */
  compact?: boolean;
  /** Override kelas kontainer; default "fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3" */
  containerClassName?: string;
  /** Dipanggil saat panel terbuka/tertutup — dipakai parent untuk menyembunyikan elemen lain */
  onOpenChange?: (open: boolean) => void;
  /** Link undangan grup WhatsApp (opsional) — ditampilkan sebagai tombol join di panel */
  groupUrl?: string | null;
}

export function WhatsAppButton({ number, iconUrl, templates = [], compact = false, containerClassName, onOpenChange, groupUrl }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const hasTemplates = templates.length > 0;
  const hasGroup = Boolean(groupUrl);

  // Close on outside click (panel maupun bottom sheet)
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      const inside =
        containerRef.current?.contains(target) || sheetRef.current?.contains(target);
      if (!inside) closePanel();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") closePanel(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function closePanel() {
    setLeaving(true);
    onOpenChange?.(false);
    setTimeout(() => { setOpen(false); setLeaving(false); }, 300);
  }

  function handleFabClick() {
    if (!number) return;
    // Tanpa template maupun link grup → langsung buka chat CS
    if (!hasTemplates && !hasGroup) {
      const clean = number.replace(/[^0-9]/g, "");
      window.open(`https://wa.me/${clean}`, "_blank", "noopener,noreferrer");
      return;
    }
    if (open) closePanel(); else { setOpen(true); onOpenChange?.(true); }
  }

  function handleJoinGroup() {
    if (!groupUrl) return;
    window.open(groupUrl, "_blank", "noopener,noreferrer");
    closePanel();
  }

  function openTemplate(msg: string) {
    if (!number) return;
    const clean = number.replace(/[^0-9]/g, "");
    window.open(
      `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`,
      "_blank",
      "noopener,noreferrer"
    );
    closePanel();
  }

  if (!number) return null;

  // Isi panel & bottom sheet sama persis
  const panelBody = (
    <>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid #f0f0f0" }}
      >
        <div className="flex items-center gap-2.5">
          {/* WA dot */}
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: "#25D366" }}
          />
          <div>
            <p className="text-[13px] font-semibold leading-tight" style={{ color: "#111" }}>
              Hubungi Kami
            </p>
            <p className="text-[11px] leading-tight" style={{ color: "#999" }}>
              via WhatsApp · Biasanya respon cepat
            </p>
          </div>
        </div>
        <button
          onClick={closePanel}
          aria-label="Tutup"
          className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
          style={{ background: "#f5f5f5", color: "#888" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#e8e8e8")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#f5f5f5")}
        >
          <svg width="10" height="10" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M1 1l7 7M8 1l-7 7" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Template list */}
      <div className="p-2.5 overflow-y-auto">
        <p
          className="px-2 pt-1 pb-2 text-[11px] font-medium uppercase tracking-wider"
          style={{ color: "#bbb" }}
        >
          Pilih topik pesan
        </p>
        <div className="space-y-0.5">
          {templates.map((tpl, i) => (
            <button
              key={i}
              onClick={() => openTemplate(tpl.message)}
              className="wa-item-in w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group"
              style={{
                animationDelay: `${i * 38}ms`,
                color: "#222",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(37,211,102,0.08)";
                e.currentTarget.style.color = "#0a7a3e";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#222";
              }}
            >
              {/* Bubble icon */}
              <span
                className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center transition-colors"
                style={{ background: "rgba(37,211,102,0.10)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                </svg>
              </span>
              <span className="text-[13px] font-medium leading-tight">{tpl.label}</span>
              {/* Arrow */}
              <svg
                className="ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                style={{ color: "#25D366" }}
              >
                <path d="M2.5 6h7M6.5 3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ))}
        </div>

        {/* Join group — terpisah dari template chat */}
        {hasGroup && (
          <div className="mt-2 border-t border-neutral-100 pt-2.5 mx-1">
            <button
              onClick={handleJoinGroup}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors group/wa"
              style={{ background: "rgba(37,211,102,0.08)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(37,211,102,0.16)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(37,211,102,0.08)"; }}
            >
              <span
                className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center"
                style={{ background: "rgba(37,211,102,0.18)" }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1da851" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="9" cy="8" r="3.2" />
                  <path d="M3.2 19.5c0-3.2 2.6-5.3 5.8-5.3s5.8 2.1 5.8 5.3" />
                  <path d="M16.2 5.4a3.2 3.2 0 0 1 0 5.6" />
                  <path d="M17.6 14.6c1.6.9 2.9 2.3 2.9 4.9" />
                </svg>
              </span>
              <span className="min-w-0 text-left">
                <span className="block text-[13px] font-semibold leading-tight" style={{ color: "#0a7a3e" }}>
                  {t("whatsapp.joinGroup")}
                </span>
                <span className="block text-[11px] leading-tight mt-0.5" style={{ color: "#999" }}>
                  {t("whatsapp.joinGroupHint")}
                </span>
              </span>
              <svg
                className="ml-auto shrink-0 text-[#25D366] group-hover/wa:translate-x-0.5 transition-transform"
                width="14"
                height="14"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                aria-hidden="true"
              >
                <path d="M2.5 6h7M6.5 3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-4 py-2.5 flex items-center gap-1.5 shrink-0"
        style={{ borderTop: "1px solid #f0f0f0" }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="#25D366">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        <span className="text-[11px]" style={{ color: "#bbb" }}>
          Pesan akan terbuka di WhatsApp
        </span>
      </div>
    </>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />

      <div
        ref={containerRef}
        className={
          containerClassName ?? "fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3"
        }
      >
        {/* ── Panel mengambang — desktop (sm+) ── */}
        {(open || leaving) && (
          <div
            className={`hidden sm:block ${leaving ? "wa-panel-out" : "wa-panel-in"} w-72 rounded-2xl overflow-hidden`}
            style={{
              background: "#fff",
              boxShadow:
                "0 24px 64px -8px rgba(0,0,0,0.20), 0 8px 24px -4px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.05)",
            }}
          >
            {panelBody}
          </div>
        )}

        {/* ── Bottom sheet — mobile (max-sm) ── */}
        {(open || leaving) && (
          <>
            {/* Backdrop */}
            <div
              className={cn(
                "fixed inset-0 sm:hidden z-50 bg-black/40 transition-opacity duration-300",
                open && !leaving ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
              onClick={closePanel}
            />
            {/* Sheet */}
            <div
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-label="Chat via WhatsApp"
              className={cn(
                "fixed inset-x-0 bottom-0 sm:hidden z-50 bg-white rounded-t-[24px] shadow-2xl flex flex-col max-h-[88vh] overflow-hidden",
                "transition-transform duration-300 ease-out",
                open && !leaving ? "translate-y-0" : "translate-y-full"
              )}
            >
              {/* Handle bar */}
              <div className="pt-2.5 pb-0.5 flex justify-center shrink-0">
                <div className="w-11 h-1.5 rounded-full bg-neutral-300" />
              </div>
              {panelBody}
            </div>
          </>
        )}

        {/* ── FAB button ── */}
        <button
          onClick={handleFabClick}
          aria-label="Chat via WhatsApp"
          className={cn(
            "flex items-center justify-center rounded-lg text-white transition-colors shadow-lg hover:opacity-90",
            "w-11 h-11",
            // Di HP saat sheet terbuka, FAB disembunyikan (tertutup backdrop)
            (open || leaving) && "max-sm:invisible max-sm:opacity-0 max-sm:pointer-events-none"
          )}
          style={{
            background: open ? "#1ea355" : "#25D366",
          }}
        >
          {open ? (
            /* X icon when panel is open */
            <svg width={compact ? 15 : 20} height={compact ? 15 : 20} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4l12 12M16 4L4 16" strokeLinecap="round" />
            </svg>
          ) : iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={iconUrl}
              alt="WhatsApp"
              width={compact ? 24 : 32}
              height={compact ? 24 : 32}
              className={compact ? "w-6 h-6 object-contain" : "w-8 h-8 object-contain"}
            />
          ) : (
            <svg width={compact ? 18 : 22} height={compact ? 18 : 22} viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
}
