import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { MainContent } from "@/components/layout/main-content";
import { Footer } from "@/components/layout/footer";
import { FooterConditional } from "@/components/layout/footer-conditional";
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
import { StoreSettingsProvider } from "@/components/providers/store-settings-provider";
import { I18nProvider } from "@/lib/i18n/client";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { getCategories } from "@/lib/queries/product";
import type { SocialLink } from "@/components/ui/social-icon";
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://hageclub.com";

// All layout settings in a single batched DB call
const LAYOUT_SETTING_KEYS = [
  "analytics_gsc_verification",
  "whatsapp_number", "whatsapp_icon_url", "whatsapp_message_templates", "whatsapp_group_url",
  "brand_logo", "brand_social_links", "nav_sidebar_logo",
  "announcement_active", "announcement_text", "announcement_duration",
  "nav_menu_items",
  "store_free_shipping_threshold", "store_free_shipping_regions",
] as const;

export async function generateMetadata(): Promise<Metadata> {
  // Keys are cached after the first call — this is a fast cache hit on subsequent requests
  const settings = await getSettingValues([...LAYOUT_SETTING_KEYS]);
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
  // No headers() call — layout stays ISR-cacheable.
  // I18nProvider uses DEFAULT_LOCALE as initial value; client hydrates from cookie on mount.

  // Single batched DB call for all layout settings — cache deduplicates with generateMetadata
  const [settings, categories] = await Promise.all([
    getSettingValues([...LAYOUT_SETTING_KEYS]),
    getCategories(),
  ]);

  let socialLinks: SocialLink[] = [];
  try {
    const raw = settings.brand_social_links;
    if (raw) socialLinks = JSON.parse(raw) as SocialLink[];
  } catch {
    // malformed JSON — treat as empty
  }

  let menuFlags: Record<string, boolean> = {};
  try {
    const raw = settings.nav_menu_items;
    if (raw) menuFlags = JSON.parse(raw);
  } catch {
    // malformed JSON — treat as all visible
  }

  const freeShippingThreshold = Number(settings.store_free_shipping_threshold ?? "500000") || 500_000;
  let freeShippingRegions: string[] = [];
  try {
    const raw = settings.store_free_shipping_regions;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) freeShippingRegions = parsed.filter((k) => typeof k === "string");
    }
  } catch {
    // malformed JSON — treat as no restriction
  }

  const announcementActive = settings.announcement_active !== "false";
  const announcementText =
    settings.announcement_text ?? "Free shipping untuk pembelian di atas Rp500.000";
  const announcementDuration = Number(settings.announcement_duration ?? 7);

  let waTemplates: MessageTemplate[] = [];
  try {
    const raw = settings.whatsapp_message_templates;
    if (raw) waTemplates = JSON.parse(raw) as MessageTemplate[];
  } catch {
    // malformed JSON — use empty (button will open WA directly)
  }

  // Flatten category tree to simple list for mobile drawer
  const categoryList = categories.flatMap((c) => [
    { name: c.name, slug: c.slug },
    ...c.children.map((ch) => ({ name: ch.name, slug: ch.slug })),
  ]);

  return (
    <I18nProvider locale={DEFAULT_LOCALE}>
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
          logoUrl={settings.brand_logo}
        />
        <MobileDrawer
          categories={categoryList}
          brand={{ social_links: socialLinks, sidebar_logo: settings.nav_sidebar_logo ?? null }}
          menu={menuFlags}
        />
        <SearchOverlay />
        <MiniCart />

        <MainContent>{children}</MainContent>
        <FooterConditional>
          <Footer socialLinks={socialLinks} logoUrl={settings.brand_logo} />
        </FooterConditional>
        <PromoPopup />
        {/* Floating Cart Alert + WA compact — hanya di homepage (cek pathname di dalam komponen) */}
        <CartFloatingAlert
          number={settings.whatsapp_number}
          iconUrl={settings.whatsapp_icon_url}
          templates={waTemplates}
          groupUrl={settings.whatsapp_group_url}
        />
        <AddToCartSheet />
      </ToastProvider>
      </StoreSettingsProvider>
    </I18nProvider>
  );
}
