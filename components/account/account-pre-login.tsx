"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { AuthBottomSheet } from "./auth-bottom-sheet";

type Tab = "orders" | "wishlist";
type SheetMode = "login" | "register";

export function AccountPreLogin() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>("orders");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>("login");

  function openSheet(mode: SheetMode) {
    setSheetMode(mode);
    setSheetOpen(true);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="max-w-md mx-auto px-4 py-6 space-y-5 md:max-w-3xl md:py-10">

        {/* Page title */}
        <h1 className="text-lg font-bold text-primary">{t("account.myAccount")}</h1>

        {/* Hero Card */}
        <div className="bg-white border border-border rounded-2xl px-6 py-6 space-y-5 shadow-sm">
          <p className="text-base font-bold text-primary leading-snug">
            Nikmati Diskon Spesial dan Pantau Pesanan Kamu
          </p>

          {/* Benefit list */}
          <div className="space-y-2.5">
            {HERO_BENEFITS.map(({ icon, title }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-primary/[0.07] flex items-center justify-center shrink-0">
                  {icon}
                </div>
                <p className="text-sm text-foreground/80">{title}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2.5 pt-1">
            <button
              onClick={() => openSheet("login")}
              className="flex-1 h-11 border border-primary text-primary text-sm font-semibold rounded-full hover:bg-primary/5 transition-colors"
            >
              {t("auth.login")}
            </button>
            <button
              onClick={() => openSheet("register")}
              className="flex-1 h-11 bg-primary text-white text-sm font-semibold rounded-full hover:bg-primary/90 transition-colors"
            >
              {t("auth.register")}
            </button>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex border-b border-border">
          {(["orders", "wishlist"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "text-primary border-b-2 border-primary -mb-px"
                  : "text-muted hover:text-primary"
              }`}
            >
              {tab === "orders" ? t("account.ordersTab") : t("account.wishlistTab")}
            </button>
          ))}
        </div>

        {/* Tab: Orders empty state */}
        {activeTab === "orders" && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
                <path d="M3 6h18l-1.5 12H4.5L3 6zM7 6V4a2 2 0 014 0v2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{t("account.loginToOrder")}</p>
              <p className="text-xs text-muted mt-1 leading-relaxed max-w-[220px]">
                {t("account.loginToOrderDesc")}
              </p>
            </div>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => openSheet("login")}
                className="px-5 py-2 border border-primary text-primary text-xs font-semibold rounded-full hover:bg-primary/5 transition-colors"
              >
                {t("auth.login")}
              </button>
              <button
                onClick={() => openSheet("register")}
                className="px-5 py-2 bg-primary text-white text-xs font-semibold rounded-full hover:bg-primary/90 transition-colors"
              >
                {t("auth.register")}
              </button>
            </div>
          </div>
        )}

        {/* Tab: Wishlist empty state */}
        {activeTab === "wishlist" && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{t("account.loginToWishlist")}</p>
              <p className="text-xs text-muted mt-1 leading-relaxed max-w-[220px]">
                {t("account.loginToWishlistDesc")}
              </p>
            </div>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => openSheet("login")}
                className="px-5 py-2 border border-primary text-primary text-xs font-semibold rounded-full hover:bg-primary/5 transition-colors"
              >
                {t("auth.login")}
              </button>
              <button
                onClick={() => openSheet("register")}
                className="px-5 py-2 bg-primary text-white text-xs font-semibold rounded-full hover:bg-primary/90 transition-colors"
              >
                {t("auth.register")}
              </button>
            </div>
          </div>
        )}
      </div>

      <AuthBottomSheet
        isOpen={sheetOpen}
        mode={sheetMode}
        onClose={() => setSheetOpen(false)}
        onSwitchMode={(m) => setSheetMode(m)}
      />
    </div>
  );
}

const HERO_BENEFITS = [
  {
    title: "Diskon & Voucher Eksklusif",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-primary">
        <path d="M2 10h16M10 2v16M5 5l10 10M15 5L5 15" />
        <circle cx="10" cy="10" r="8" />
      </svg>
    ),
  },
  {
    title: "Lacak Pesanan Real-Time",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-primary">
        <path d="M3 5h10v9H3zM13 7l2 1.5L17 7v7h-4V7zM3 5V3.5A1.5 1.5 0 014.5 2h5A1.5 1.5 0 0111 3.5V5" />
      </svg>
    ),
  },
  {
    title: "Wishlist Produk Favorit",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-primary">
        <path d="M10 16.5S2.5 11.5 2.5 6.5C2.5 4.5 4 3 6 3c1 0 2 .5 2.7 1.3A3.3 3.3 0 0110 5.7c.3-.5.8-1 1.3-1.4A3.5 3.5 0 0114 3c2 0 3.5 1.5 3.5 3.5C17.5 11.5 10 16.5 10 16.5z" />
      </svg>
    ),
  },
  {
    title: "Riwayat Pembelian Lengkap",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-primary">
        <rect x="3" y="2" width="14" height="16" rx="2" />
        <path d="M7 7h6M7 10h6M7 13h4" />
      </svg>
    ),
  },
];

