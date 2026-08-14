"use client";

import { signOut } from "next-auth/react";
import { useI18n } from "@/lib/i18n/client";

export function AccountSignOut() {
  const { t } = useI18n();
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="w-full flex items-center justify-center gap-2 py-3 text-sm text-muted border border-border rounded-xl hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-colors"
    >
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-4 h-4 shrink-0">
        <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M11 11l3-3-3-3M14 8H6" />
      </svg>
      {t("nav.signOut")}
    </button>
  );
}
