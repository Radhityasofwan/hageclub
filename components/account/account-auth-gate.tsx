"use client";

import Link from "next/link";
import { useAuthModal } from "@/stores/auth-modal-store";
import { useI18n } from "@/lib/i18n/client";

export function AccountAuthGate() {
  const openAuthModal = useAuthModal((s) => s.open);
  const { t } = useI18n();

  const LOCKED_FEATURES = [
    {
      icon: (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
          <path d="M4 5.5h12l-1.5 10.5h-9L4 5.5zm2-1.5V3a3 3 0 016 0v1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      label: t("account.lockedOrders"),
      desc: t("account.lockedOrdersDesc"),
    },
    {
      icon: (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
          <path d="M10 17S3 12.5 3 7.5C3 5.5 4.5 4 6.5 4c1.2 0 2.3.6 3 1.5C10.2 4.6 11.3 4 12.5 4c2 0 3.5 1.5 3.5 3.5C16 12.5 10 17 10 17Z" strokeLinejoin="round" />
        </svg>
      ),
      label: t("account.lockedWishlist"),
      desc: t("account.lockedWishlistDesc"),
    },
    {
      icon: (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
          <path d="M10 2C7.2 2 5 4.2 5 7c0 4 5 10 5 10s5-6 5-10c0-2.8-2.2-5-5-5z" />
          <circle cx="10" cy="7" r="2" />
        </svg>
      ),
      label: t("account.lockedAddress"),
      desc: t("account.lockedAddressDesc"),
    },
    {
      icon: (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
          <circle cx="10" cy="7" r="3" />
          <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" />
        </svg>
      ),
      label: t("account.lockedProfile"),
      desc: t("account.lockedProfileDesc"),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted mb-6">
        <Link href="/" className="hover:text-primary transition-colors">
          {t("nav.home")}
        </Link>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0">
          <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-primary font-medium">{t("account.title")}</span>
      </nav>

      <div className="max-w-lg mx-auto text-center">
        {/* Lock icon */}
        <div className="w-16 h-16 rounded-full bg-accent border border-border flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-muted">
            <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1.5" fill="currentColor" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-primary mb-2">{t("account.gateTitle")}</h1>
        <p className="text-sm text-muted leading-relaxed mb-8 max-w-sm mx-auto">
          {t("account.gateDesc")}
        </p>

        {/* Locked feature cards */}
        <div className="grid grid-cols-2 gap-2.5 mb-8">
          {LOCKED_FEATURES.map((f) => (
            <div
              key={f.label}
              className="relative bg-white border border-border rounded-xl p-4 text-left opacity-60 select-none"
            >
              <div className="absolute top-2.5 right-2.5">
                <svg width="10" height="12" viewBox="0 0 10 12" fill="none" className="text-muted">
                  <rect x="1" y="5" width="8" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M3 5V3.5a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-primary mb-2 block">{f.icon}</span>
              <p className="text-sm font-semibold text-primary">{f.label}</p>
              <p className="text-xs text-muted mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => openAuthModal("login")}
            className="flex-1 max-w-[160px] h-11 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            {t("auth.login")}
          </button>
          <button
            onClick={() => openAuthModal("register")}
            className="flex-1 max-w-[160px] h-11 border border-primary text-primary text-sm font-medium rounded-lg hover:bg-primary/5 transition-colors"
          >
            {t("auth.register")}
          </button>
        </div>
      </div>
    </div>
  );
}
