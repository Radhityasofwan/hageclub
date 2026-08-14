"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { useUiStore } from "@/stores/ui-store";

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  image: string | null;
}

export function SearchOverlay() {
  const { t } = useI18n();
  const { searchOpen: open, closeSearch: onClose } = useUiStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setResults([]);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.data ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timerRef.current);
  }, [query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" onKeyDown={handleKeyDown}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative max-w-2xl mx-auto mt-20 px-4">
        <div className="bg-white border border-border shadow-xl">
          {/* Input */}
          <div className="flex items-center gap-3 px-4 h-14 border-b border-border">
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              className="text-muted shrink-0"
            >
              <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M13.5 13.5L17 17"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder={t("search.placeholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 text-sm outline-none border-0 bg-transparent placeholder:text-muted"
              autoComplete="off"
            />
            <button
              onClick={onClose}
              className="text-xs text-muted hover:text-primary transition-colors shrink-0"
            >
              ESC
            </button>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!loading && query.length >= 2 && results.length === 0 && (
              <div className="py-10 text-center">
                <p className="text-sm text-muted">
                  {t("search.noResults", { query })}
                </p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <ul>
                {results.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors"
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 object-cover bg-accent rounded shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-accent rounded shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-primary truncate">{item.name}</p>
                        <p className="text-xs text-muted">
                          {item.salePrice ? (
                            <>
                              <span className="text-destructive font-medium">
                                Rp{item.salePrice.toLocaleString("id-ID")}
                              </span>
                              <span className="line-through ml-1">
                                Rp{item.price.toLocaleString("id-ID")}
                              </span>
                            </>
                          ) : (
                            `Rp${item.price.toLocaleString("id-ID")}`
                          )}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {!loading && query.length < 2 && (
              <div className="py-10 text-center">
                <p className="text-xs text-muted">
                  {t("search.minChars")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
