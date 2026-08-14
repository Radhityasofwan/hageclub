"use client";

import { useI18n } from "@/lib/i18n/client";
import { LOCALES } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const labels: Record<string, string> = {
  id: "ID",
  en: "EN",
};

export function LanguageSwitcher({
  variant = "icon",
  tone = "light",
}: {
  variant?: "icon" | "text" | "toggle" | "compact";
  /** "light" = teks terang (untuk bg gelap, default); "dark" = teks gelap (untuk bg terang) */
  tone?: "light" | "dark";
}) {
  const { locale, setLocale } = useI18n();

  const nextLocale = locale === "id" ? "en" : "id";

  if (variant === "text") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-white/60">
        {LOCALES.map((l) => (
          <button
            key={l}
            onClick={() => setLocale(l)}
            className={
              locale === l
                ? "text-white font-semibold"
                : "hover:text-white transition-colors"
            }
          >
            {labels[l]}
          </button>
        ))}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <button
        onClick={() => setLocale(nextLocale)}
        aria-label={`Switch to ${nextLocale === "id" ? "Bahasa Indonesia" : "English"}`}
        title={nextLocale === "id" ? "Ganti ke Bahasa Indonesia" : "Switch to English"}
        className={cn(
          "text-[11px] font-bold tracking-widest leading-none px-1 py-1 select-none transition-colors",
          tone === "light" ? "text-white/60 hover:text-white" : "text-primary/60 hover:text-primary"
        )}
      >
        {labels[locale]}
      </button>
    );
  }

  if (variant === "toggle") {
    return (
      <div
        role="group"
        aria-label="Switch language"
        className="flex items-center rounded-full border border-white/25 p-0.5 text-[11px] font-semibold tracking-wider select-none"
      >
        {LOCALES.map((l) => (
          <button
            key={l}
            onClick={() => setLocale(l)}
            aria-pressed={locale === l}
            title={l === "id" ? "Bahasa Indonesia" : "English"}
            className={cn(
              "px-2.5 py-1 rounded-full transition-colors duration-200",
              locale === l
                ? "bg-white text-primary shadow-sm"
                : "text-white/70 hover:text-white"
            )}
          >
            {labels[l]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <button
      onClick={() => setLocale(nextLocale)}
      className={cn(
        "flex items-center justify-center w-10 h-10 rounded transition-colors",
        tone === "light" ? "text-white hover:bg-white/10" : "text-primary hover:bg-primary/10"
      )}
      aria-label={`Switch language to ${nextLocale === "id" ? "Indonesian" : "English"}`}
      title={nextLocale === "id" ? "Bahasa Indonesia" : "English"}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    </button>
  );
}
