"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import type { V2Destination } from "@/types";

interface LocationSearchProps {
  /** ID wilayah terpilih saat ini (untuk inisialisasi) */
  selected?: { id: string; label: string } | null;
  onSelect: (location: V2Destination) => void;
  onClear?: () => void;
  error?: string;
  className?: string;
  /** Dipanggil saat panel hasil terbuka/tertutup — dipakai parent untuk
   *  menyesuaikan tinggi modal (mis. agar dropdown lebih lega). */
  onOpenChange?: (open: boolean) => void;
  /** Class tambahan untuk panel hasil (dropdown) — mis. menaikkan tinggi maks. */
  listClassName?: string;
}

const DEBOUNCE_MS = 400;
const MIN_QUERY = 2;

// Pencarian wilayah tujuan (RajaOngkir V2 — domestic-destination) dengan
// debounce. Satu query mengembalikan hierarki lengkap provinsi/kota/kecamatan.
export function LocationSearch({
  selected,
  onSelect,
  onClear,
  error,
  className,
  onOpenChange,
  listClassName,
}: LocationSearchProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<V2Destination[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < MIN_QUERY) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/shipping/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          setSearchError(
            json?.code === "NOT_CONFIGURED" ? t("shipping.notConfigured") : t("shipping.searchError")
          );
          setResults([]);
          return;
        }
        const json = await res.json();
        if (activeRef.current || q === query.trim()) {
          setResults(json.data ?? []);
          setSearchError("");
          setOpen(true);
        }
      } catch {
        setSearchError(t("shipping.searchError"));
      } finally {
        setSearching(false);
      }
    }, DEBOUNCE_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    activeRef.current = open;
    onOpenChange?.(open);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleSelect(location: V2Destination) {
    onSelect(location);
    setQuery("");
    setResults([]);
    setOpen(false);
    setSearchError("");
  }

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      {selected ? (
        <div className="flex items-center justify-between gap-3 bg-primary/5 border border-primary/30 rounded-sm px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-muted mb-0.5">
              {t("shipping.selectedLocation")}
            </p>
            <p className="text-sm font-medium truncate">{selected.label}</p>
          </div>
          {onClear && (
            <button
              type="button"
              onClick={() => {
                onClear();
                setOpen(false);
              }}
              className="shrink-0 text-xs text-muted hover:text-destructive transition-colors"
            >
              {t("shipping.clearLocation")}
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder={t("shipping.locationPlaceholder")}
            autoComplete="off"
            spellCheck={false}
            className="w-full h-11 border border-border rounded-sm px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white"
          />
          {searching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
              {t("shipping.searching")}
            </span>
          )}

          {open && (
            <div className={cn("absolute z-30 mt-1 w-full bg-white border border-border rounded-sm shadow-lg max-h-64 overflow-y-auto", listClassName)}>
              {results.length === 0 ? (
                <p className="px-3 py-2.5 text-xs text-muted">
                  {searchError || t("shipping.noResults")}
                </p>
              ) : (
                results.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelect(r)}
                    className="w-full text-left px-3 py-2.5 hover:bg-accent transition-colors"
                  >
                    <p className="text-sm">{r.label}</p>
                    <p className="text-[11px] text-muted mt-0.5">
                      {[r.province_name, r.city_name, r.district_name, r.subdistrict_name]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
