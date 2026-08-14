"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/client";

export function copyText(text: string, setCopied: (v: boolean) => void) {
  navigator.clipboard.writeText(text).catch(() => {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  });
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
}

export function CopyBtn({
  text,
  label,
  iconOnly = false,
}: {
  text: string;
  label: string;
  iconOnly?: boolean;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => copyText(text, setCopied)}
      aria-label={iconOnly ? label : undefined}
      title={iconOnly ? label : undefined}
      className={
        iconOnly
          ? `inline-flex items-center shrink-0 transition-colors ${copied ? "text-success" : "text-muted hover:text-primary"}`
          : "inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium shrink-0"
      }
    >
      {copied ? (
        <svg width={iconOnly ? 16 : 12} height={iconOnly ? 16 : 12} viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      ) : (
        <svg width={iconOnly ? 16 : 12} height={iconOnly ? 16 : 12} viewBox="0 0 12 12" fill="none"><rect x="1" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" /><path d="M4 4V3a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-1 1h-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
      )}
      {!iconOnly && <span>{copied ? t("payment.copied") : label}</span>}
    </button>
  );
}
