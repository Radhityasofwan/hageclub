"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useI18n } from "@/lib/i18n/client";

export function AccountNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  const NAV_ITEMS = [
    { label: t("account.dashboard"), href: "/account", icon: <DashboardIcon /> },
    { label: t("account.quickOrders"), href: "/account/orders", icon: <OrderIcon /> },
    { label: t("account.statWishlist"), href: "/account?tab=wishlist", icon: <WishlistIcon /> },
    { label: t("account.myVouchers"), href: "/account/vouchers", icon: <VoucherIcon /> },
    { label: t("account.addresses"), href: "/account/address", icon: <AddressIcon /> },
    { label: t("account.profileSecurity"), href: "/account/profile", icon: <ProfileIcon /> },
  ];

  function isActive(href: string) {
    if (href === "/account") return pathname === "/account";
    return pathname.startsWith(href);
  }

  return (
    <nav className="bg-white border border-border rounded-xl overflow-hidden">
      {/* Site navigasi — tetap di website */}
      <div className="border-b border-border/50 bg-accent/30 px-3 py-2">
        <p className="text-[10px] font-semibold tracking-widest text-muted uppercase mb-1">
          {t("account.navSection")}
        </p>
        <div className="flex gap-1">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted hover:text-primary hover:bg-accent rounded-lg transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M1 8L8 1L15 8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 6.5V14H13V6.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t("nav.home")}
          </Link>
          <Link
            href="/shop"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted hover:text-primary hover:bg-accent rounded-lg transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 4.5h10l-1.5 9h-7L3 4.5zm2-1.5V3a3 3 0 016 0v1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t("nav.shop")}
          </Link>
        </div>
      </div>

      {/* Menu akun */}
      <div className="divide-y divide-border">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                active
                  ? "bg-primary/5 text-primary font-semibold border-l-2 border-primary"
                  : "text-muted hover:text-primary hover:bg-accent/60"
              }`}
            >
              <span className={`w-4 h-4 shrink-0 ${active ? "text-primary" : "text-muted"}`}>
                {item.icon}
              </span>
              {item.label}
              {active && (
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="w-3.5 h-3.5 ml-auto text-primary"
                >
                  <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </Link>
          );
        })}
      </div>

      <div className="border-t border-border">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-muted hover:text-destructive hover:bg-destructive/5 transition-colors"
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="w-4 h-4 shrink-0"
            strokeLinecap="round"
          >
            <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M11 11l3-3-3-3M14 8H6" />
          </svg>
          {t("nav.signOut")}
        </button>
      </div>
    </nav>
  );
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" />
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1" />
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1" />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1" />
    </svg>
  );
}

function OrderIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 4.5h10l-1 9H4l-1-9zM5 4.5V3a2 2 0 014 0v1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WishlistIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 13.5S2 10 2 6a3 3 0 015-1.5A3 3 0 0114 6c0 4-6 7.5-6 7.5z" />
    </svg>
  );
}

function VoucherIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="1" y="4.5" width="14" height="7" rx="1.5" />
      <path d="M6 4.5v7M1 8h2M13 8h2" />
    </svg>
  );
}

function AddressIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 3.5 4.5 8.5 4.5 8.5s4.5-5 4.5-8.5c0-2.5-2-4.5-4.5-4.5z" />
      <circle cx="8" cy="6" r="1.5" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="5" r="3" />
      <path d="M2 14.5c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    </svg>
  );
}
