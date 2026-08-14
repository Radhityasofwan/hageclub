import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { MainContent } from "@/components/layout/main-content";
import { Footer } from "@/components/layout/footer";
import { MobileDrawer } from "@/components/layout/mobile-drawer";
import { SearchOverlay } from "@/components/layout/search-overlay";
import { MiniCart } from "@/components/cart/mini-cart";

import { ToastProvider } from "@/components/ui/toast";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import type { MessageTemplate } from "@/components/common/whatsapp-button";
import { CartFloatingAlert } from "@/components/cart/cart-floating-alert";
import { AddToCartSheet } from "@/components/cart/add-to-cart-sheet";
import { PromoPopup } from "@/components/public/promo-popup";
import { buildOrganizationSchema, buildWebsiteSchema } from "@/lib/schema";
import { getSettingValues } from "@/lib/settings";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { StoreSettingsProvider } from "@/components/providers/store-settings-provider";
import { I18nProvider } from "@/lib/i18n/client";
import { getLocale } from "@/lib/i18n/server";
import type { SocialLink } from "@/components/ui/social-icon";
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://hageclub.com";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettingValues(["analytics_gsc_verification"]);
  const gscId = settings.analytics_gsc_verification;

  return {
    title: {
      default: "HAGE CLUB — The Pinnacle of Refined Comfort",
      template: "%s | HAGE CLUB",
    },
    description:
      "Premium automotive lifestyle fashion brand. Quality, comfort, authenticity, and timelessness in every piece.",
    keywords: ["hage club", "automotive lifestyle", "fashion", "polo", "hoodie", "jacket", "indonesia"],
    metadataBase: new URL(BASE_URL),
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "id_ID",
      siteName: "HAGE CLUB",
      title: "HAGE CLUB — The Pinnacle of Refined Comfort",
      description:
        "Premium automotive lifestyle fashion brand. Quality, comfort, authenticity, and timelessness in every piece.",
    },
    twitter: {
      card: "summary_large_image",
      title: "HAGE CLUB — The Pinnacle of Refined Comfort",
      description:
        "Premium automotive lifestyle fashion brand. Quality, comfort, authenticity, and timelessness in every piece.",
    },
    robots: {
      index: true,
      follow: true,
    },
    ...(gscId ? { verification: { google: gscId } } : {}),
  };
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isAccountPage = pathname.startsWith("/account");
  const isCheckoutPage = pathname.startsWith("/checkout");
  const [waSettings, brandSettings, announcementSettings, menuSettings, storeSettings, categories] = await Promise.all([
    getSettingValues(["whatsapp_number", "whatsapp_icon_url", "whatsapp_message_templates", "whatsapp_group_url"]),
    getSettingValues(["brand_logo", "brand_social_links", "nav_sidebar_logo"]),
    getSettingValues(["announcement_active", "announcement_text", "announcement_duration"]),
    getSettingValues(["nav_menu_items"]),
    getSettingValues(["store_free_shipping_threshold", "store_free_shipping_regions"]),
    db.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { name: true, slug: true },
    }).catch(() => [] as { name: string; slug: string }[]),
  ]);

  let socialLinks: SocialLink[] = [];
  try {
    const raw = brandSettings.brand_social_links;
    if (raw) socialLinks = JSON.parse(raw) as SocialLink[];
  } catch {
    // malformed JSON — treat as empty
  }

  let menuFlags: Record<string, boolean> = {};
  try {
    const raw = menuSettings.nav_menu_items;
    if (raw) menuFlags = JSON.parse(raw);
  } catch {
    // malformed JSON — treat as all visible
  }

  const freeShippingThreshold = Number(storeSettings.store_free_shipping_threshold ?? "500000") || 500_000;
  let freeShippingRegions: string[] = [];
  try {
    const raw = storeSettings.store_free_shipping_regions;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) freeShippingRegions = parsed.filter((k) => typeof k === "string");
    }
  } catch {
    // malformed JSON — treat as no restriction
  }

  const announcementActive = announcementSettings.announcement_active !== "false";
  const announcementText =
    announcementSettings.announcement_text ?? "Free shipping untuk pembelian di atas Rp500.000";
  const announcementDuration = Number(announcementSettings.announcement_duration ?? 7);

  let waTemplates: MessageTemplate[] = [];
  try {
    const raw = waSettings.whatsapp_message_templates;
    if (raw) waTemplates = JSON.parse(raw) as MessageTemplate[];
  } catch {
    // malformed JSON — use empty (button will open WA directly)
  }

  return (
    <I18nProvider locale={locale}>
      <StoreSettingsProvider freeShippingThreshold={freeShippingThreshold} freeShippingRegions={freeShippingRegions}>
      <ToastProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: buildOrganizationSchema() }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: buildWebsiteSchema() }}
        />
        <AnalyticsProvider />
        {announcementActive && (
          <AnnouncementBar text={announcementText} duration={announcementDuration} />
        )}
        <Header
          announcementActive={announcementActive}
          logoUrl={brandSettings.brand_logo}
        />
        <MobileDrawer
          categories={categories}
          brand={{ social_links: socialLinks, sidebar_logo: brandSettings.nav_sidebar_logo ?? null }}
          menu={menuFlags}
        />
        <SearchOverlay />
        <MiniCart />

        <MainContent>{children}</MainContent>
        {!isAccountPage && !isCheckoutPage && <Footer socialLinks={socialLinks} logoUrl={brandSettings.brand_logo} />}
        <PromoPopup />
        {/* Floating Cart Alert + WA compact — hanya di homepage (cek pathname di dalam komponen) */}
        <CartFloatingAlert
          number={waSettings.whatsapp_number}
          iconUrl={waSettings.whatsapp_icon_url}
          templates={waTemplates}
          groupUrl={waSettings.whatsapp_group_url}
        />
        <AddToCartSheet />
      </ToastProvider>
      </StoreSettingsProvider>
    </I18nProvider>
  );
}
