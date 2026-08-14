"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/stores/cart-store";
import { useUiStore } from "@/stores/ui-store";

import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/client";
import { useSmartBack } from "@/hooks/use-smart-back";
import { cn } from "@/lib/utils";

const ANNOUNCEMENT_HEIGHT = 36;
const ICON_BTN =
  "flex items-center justify-center w-10 h-10 rounded hover:bg-white/10 transition-colors";
const ICON_BTN_DARK =
  "flex items-center justify-center w-10 h-10 rounded hover:bg-primary/10 transition-colors";

interface HeaderProps {
  announcementActive?: boolean;
  logoUrl?: string | null;
}

export function Header({ announcementActive = true, logoUrl }: HeaderProps) {
  const { t } = useI18n();
  const goBack = useSmartBack();
  // Pathname dari client (reaktif) — layout server memakai headers() yang stale
  // saat navigasi client-side, sehingga variant navbar dihitung di sini.
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const announcementVisible = useUiStore((s) => s.announcementVisible);
  const announcementClosing = useUiStore((s) => s.announcementClosing);
  const announcementEntered = useUiStore((s) => s.announcementEntered);
  const { data: session, status } = useSession();
  const { clearCart } = useCartStore();
  const { toggleMobileMenu } = useUiStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Clear persisted cart when user is not authenticated
  useEffect(() => {
    if (status === "unauthenticated") clearCart();
  }, [status, clearCart]);

  // Ikut bergerak bersama announcement bar: terdorong turun saat bar masuk,
  // naik kembali saat bar menutup — kurva & durasi identik dengan bar.
  const announcementShown =
    announcementActive && announcementVisible && !announcementClosing && announcementEntered;
  const headerTop = announcementShown ? ANNOUNCEMENT_HEIGHT : 0;

  // Transparan hanya di landing page saat masih di atas; scroll → solid.
  const transparent = isHome && !scrolled;

  // Navbar lama (hamburger + logo tengah + Language/Akun) — dipakai di web (md+)
  // untuk semua halaman; di homepage dipakai di semua ukuran layar.
  const homeHeader = (
    <header
      style={{
        top: headerTop,
        transition:
          "top 0.55s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease",
      }}
      className={cn(
        "fixed left-0 right-0 z-40 text-white",
        // Di halaman non-homepage, navbar lama hanya tampil di web (md+);
        // HP memakai navbar navigasi di bawah.
        !isHome && "hidden md:block",
        transparent ? "bg-transparent" : "bg-primary",
        scrolled ? "shadow-md" : !transparent && "shadow-sm"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 grid grid-cols-3 items-center">
        {/* Hamburger — left */}
        <div className="flex justify-start">
          <button
            onClick={toggleMobileMenu}
            aria-label={t("header.openMenu")}
            className="flex items-center justify-center w-10 h-10 rounded hover:bg-white/10 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M3 6h14M3 10h14M3 14h14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Logo — center */}
        <div className="flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-2 py-1 rounded hover:bg-white/10 transition-colors"
          >
            {logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={logoUrl}
                alt="HAGE CLUB"
                className="h-10 w-auto object-contain"
              />
            ) : (
              <span className="text-base sm:text-lg font-bold tracking-[0.15em]">HAGE CLUB</span>
            )}
          </Link>
        </div>

        {/* Right icons */}
        <div className="flex justify-end items-center gap-0.5">
          {/* Language — compact label, visible on all breakpoints */}
          <LanguageSwitcher variant="compact" />

          {/* Account — Link when logged in, button that opens auth modal when not */}
          <Link href="/account" aria-label={session ? t("header.myAccount") : t("header.signIn")} className={ICON_BTN}>
            <AccountIcon />
          </Link>
        </div>
      </div>
    </header>
  );

  // Halaman selain homepage — HP: navbar navigasi (Back + logo + Language + Akun),
  // web tetap navbar lama (homeHeader, hidden md:block).
  if (!isHome) {
    return (
      <>
        {homeHeader}
        <header
          style={{
            top: headerTop,
            transition:
              "top 0.55s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease",
          }}
          className="fixed left-0 right-0 z-40 md:hidden bg-white text-primary shadow-sm"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
            {/* Kiri — Back + Logo (rata kiri) */}
            <div className="flex items-center min-w-0">
              <button
                type="button"
                onClick={goBack}
                aria-label={t("header.back")}
                className="flex items-center justify-center w-10 h-10 rounded hover:bg-primary/10 transition-colors shrink-0"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M12.5 4.5 7 10l5.5 5.5"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <Link
                href="/"
                className="inline-flex items-center min-w-0 px-1.5 py-1 rounded hover:bg-primary/10 transition-colors"
              >
                {logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={logoUrl}
                    alt="HAGE CLUB"
                    className="h-10 w-auto object-contain"
                  />
                ) : (
                  <span className="text-base sm:text-lg font-bold tracking-[0.15em]">HAGE CLUB</span>
                )}
              </Link>
            </div>

            {/* Kanan — Language + Akun saja */}
            <div className="flex items-center gap-0.5 shrink-0">
              <LanguageSwitcher variant="compact" tone="dark" />
              <Link href="/account" aria-label={session ? t("header.myAccount") : t("header.signIn")} className={ICON_BTN_DARK}>
                <AccountIcon />
              </Link>
            </div>
          </div>
        </header>
      </>
    );
  }

  return homeHeader;
}

function AccountIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M4 17c0-3.314 2.686-6 6-6s6 2.686 6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
