"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUiStore } from "@/stores/ui-store";

import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { SocialIcon, type SocialLink } from "@/components/ui/social-icon";

interface Category {
  name: string;
  slug: string;
}

export interface BrandSettings {
  social_links: SocialLink[];
  sidebar_logo?: string | null;
}

export interface MenuFlags {
  home?: boolean;
  categories?: boolean;
  blog?: boolean;
  about?: boolean;
  contact?: boolean;
  social?: boolean;
  account?: boolean;
}

export function MobileDrawer({
  categories,
  brand,
  menu = {},
}: {
  categories: Category[];
  brand: BrandSettings;
  menu?: MenuFlags;
}) {
  const { t } = useI18n();
  const { mobileMenuOpen, closeMobileMenu, toggleSearch } = useUiStore();
  const { data: session } = useSession();
  function handleSearch() {
    closeMobileMenu();
    setTimeout(toggleSearch, 300);
  }

  const show = (key: keyof MenuFlags) => menu[key] !== false;

  const pageLinks = [
    { key: "blog" as const, label: "Blog", href: "/blog" },
    { key: "about" as const, label: t("mobileDrawer.about"), href: "/about" },
    { key: "contact" as const, label: t("mobileDrawer.contact"), href: "/contact" },
  ].filter((link) => show(link.key));

  // Close on Escape
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobileMenu();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen, closeMobileMenu]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300",
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("mobileDrawer.navigation")}
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 bg-white flex flex-col transition-transform duration-300 ease-in-out",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-border">
          <Link
            href="/"
            className="inline-flex items-center max-w-[180px]"
            onClick={closeMobileMenu}
          >
            {brand.sidebar_logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={brand.sidebar_logo}
                alt="HAGE CLUB"
                className="h-10 w-auto object-contain"
              />
            ) : (
              <span className="text-lg font-bold tracking-wider text-primary">HAGE CLUB</span>
            )}
          </Link>
          <button
            onClick={closeMobileMenu}
            aria-label={t("mobileDrawer.close")}
            className="p-2 rounded text-muted hover:text-primary hover:bg-accent transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M15 5L5 15M5 5L15 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Search bar */}
        <div className="px-4 py-3 border-b border-border">
          <button
            onClick={handleSearch}
            className="w-full flex items-center gap-2.5 h-9 px-3 bg-accent rounded-sm text-sm text-muted hover:text-primary hover:bg-accent/80 transition-colors text-left"
            aria-label={t("header.search")}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="shrink-0" aria-hidden="true">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <span>{t("common.search")}...</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3">
          <ul>
            {/* Home */}
            {show("home") && (
              <li>
                <Link
                  href="/"
                  className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-primary hover:bg-accent transition-colors"
                  onClick={closeMobileMenu}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted shrink-0">
                    <path d="M1 8L8 1L15 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 6.5V14H13V6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t("mobileDrawer.home")}
                </Link>
              </li>
            )}

            {/* Product categories — directly listed */}
            {show("categories") && (
              <>
                <li className="px-5 pt-4 pb-1">
                  <p className="text-[10px] text-muted uppercase tracking-widest font-semibold">{t("mobileDrawer.categories")}</p>
                </li>
                {categories.map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      href={`/shop/${cat.slug}`}
                      className="block px-5 py-2.5 text-sm text-primary hover:bg-accent transition-colors"
                      onClick={closeMobileMenu}
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </>
            )}

            {/* Pages */}
            {pageLinks.length > 0 && (
              <>
                <li className="px-5 pt-4 pb-1">
                  <p className="text-[10px] text-muted uppercase tracking-widest font-semibold">{t("mobileDrawer.pages")}</p>
                </li>
                {pageLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block px-5 py-2.5 text-sm text-primary hover:bg-accent transition-colors"
                      onClick={closeMobileMenu}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </>
            )}
          </ul>
        </nav>

        {/* Social Media & Account */}
        {(show("social") || show("account")) && (
          <div className="border-t border-border">
            {/* Social icons */}
            {show("social") && brand.social_links.length > 0 && (
              <div className="flex items-center justify-center gap-5 py-4 px-5 flex-wrap">
                {brand.social_links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target={link.url.startsWith("mailto:") ? undefined : "_blank"}
                    rel={link.url.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                    className="text-muted hover:text-primary transition-colors"
                    aria-label={link.label || link.platform}
                  >
                    <span className="flex w-5 h-5">
                      <SocialIcon
                        platform={link.platform}
                        icon={link.icon}
                        label={link.label || link.platform}
                      />
                    </span>
                  </a>
                ))}
              </div>
            )}

            {/* Account links */}
            {show("account") && (
              <div className="border-t border-border">
                {session ? (
                  <div className="flex items-center divide-x divide-border">
                    <Link
                      href="/account?tab=wishlist"
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-primary hover:bg-accent transition-colors"
                      onClick={closeMobileMenu}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 14S2 10 2 6c0-1.6 1.2-3 3-3 .96 0 1.84.48 2.4 1.2L8 5l.6-.8C9.16 3.48 10.04 3 11 3c1.8 0 3 1.4 3 3 0 4-6 8-6 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                      </svg>
                      {t("mobileDrawer.wishlist")}
                    </Link>
                    <Link
                      href="/account"
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-primary hover:bg-accent transition-colors"
                      onClick={closeMobileMenu}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      {t("mobileDrawer.myAccount")}
                    </Link>
                  </div>
                ) : (
                  <div className="py-3 px-5">
                    <Link
                      href="/account"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-2 py-1.5 text-sm font-medium text-primary hover:opacity-70 transition-opacity"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      {t("mobileDrawer.signIn")}
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
