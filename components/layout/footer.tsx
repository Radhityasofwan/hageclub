import Link from "next/link";
import { SocialIcon, type SocialLink } from "@/components/ui/social-icon";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { getI18n } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { getFooterPages, pageHref } from "@/lib/cms";
import { getSettingValues } from "@/lib/settings";
import {
  getPaymentMethod,
  getShippingCourier,
  PAYMENT_METHODS,
  SHIPPING_COURIERS,
  type FooterPaymentMethod,
} from "@/lib/footer-catalog";
import { FooterSection } from "./footer-section";
import { PaymentBadge } from "@/components/footer/payment-badges";

interface MethodRender {
  method: FooterPaymentMethod;
  imageUrl?: string | null;
}

interface FooterProps {
  socialLinks?: SocialLink[];
  logoUrl?: string | null;
}

interface LinkItem {
  label: string;
  href: string;
}

interface MethodConfig {
  id: string;
  imageUrl?: string | null;
}

function parseLinkJson(raw: string | null): LinkItem[] {
  if (!raw) return [];
  try { return JSON.parse(raw) as LinkItem[]; } catch { return []; }
}

function parseSocialJson(raw: string | null): SocialLink[] {
  if (!raw) return [];
  try { return JSON.parse(raw) as SocialLink[]; } catch { return []; }
}

function parseMethodJson(raw: string | null): MethodConfig[] {
  if (!raw) return [];
  try { return JSON.parse(raw) as MethodConfig[]; } catch { return []; }
}

export async function Footer({ socialLinks = [], logoUrl = null }: FooterProps) {
  const { t } = await getI18n();
  const year = new Date().getFullYear();

  const [categories, infoPages, s] = await Promise.all([
    db.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { name: true, slug: true },
    }),
    getFooterPages(),
    getSettingValues([
      "footer_tagline",
      "footer_copyright",
      "footer_made_with_care",
      "footer_nav_heading",
      "footer_nav_show_products",
      "footer_nav_show_categories",
      "footer_nav_links",
      "footer_payment_heading",
      "footer_payment_methods",
      "footer_shipping_heading",
      "footer_shipping_couriers",
      "footer_legal_heading",
      "footer_legal_show_cms",
      "footer_legal_links",
      "footer_social_links",
    ]),
  ]);

  // ── Brand ──────────────────────────────────────────────────────────────────
  const tagline      = s.footer_tagline      ?? t("footer.brandTagline");
  const copyrightTxt = s.footer_copyright    ?? `HAGE CLUB. ${t("footer.allRightsReserved")}`;
  const madeWithCare = s.footer_made_with_care ?? t("footer.madeWithCare");

  const configuredSocial = parseSocialJson(s.footer_social_links);
  const social: SocialLink[] = configuredSocial.length > 0 ? configuredSocial : socialLinks;

  // ── Navigasi ───────────────────────────────────────────────────────────────
  const navHeading        = s.footer_nav_heading          ?? t("footer.shopHeading");
  const navShowProducts   = s.footer_nav_show_products    !== "false";
  const navShowCategories = s.footer_nav_show_categories  !== "false";
  const navCustomLinks    = parseLinkJson(s.footer_nav_links);

  const navLinks: LinkItem[] = [
    ...(navShowProducts ? [{ label: t("footer.allProducts"), href: "/shop" }] : []),
    ...(navShowCategories ? categories.map((c) => ({ label: c.name, href: `/shop/${c.slug}` })) : []),
    ...navCustomLinks,
  ];

  // ── Payment & Shipping ─────────────────────────────────────────────────────
  const paymentHeading = s.footer_payment_heading  ?? t("footer.paymentHeading");
  const shippingHeading = s.footer_shipping_heading ?? t("footer.shippingHeading");

  // Setting null (belum diatur) → seluruh katalog tampil; array kosong (sengaja
  // dinonaktifkan semua) → tidak ada yang tampil
  const paymentConfig = s.footer_payment_methods ? parseMethodJson(s.footer_payment_methods) : null;
  const shippingConfig = s.footer_shipping_couriers ? parseMethodJson(s.footer_shipping_couriers) : null;

  const paymentMethods: MethodRender[] = paymentConfig
    ? paymentConfig
        .map((m) => ({ method: getPaymentMethod(m.id), imageUrl: m.imageUrl }))
        .filter((m): m is { method: FooterPaymentMethod; imageUrl: string | null | undefined } => m.method !== undefined)
    : PAYMENT_METHODS.map((m) => ({ method: m, imageUrl: null }));

  const shippingMethods: MethodRender[] = shippingConfig
    ? shippingConfig
        .map((m) => ({ method: getShippingCourier(m.id), imageUrl: m.imageUrl }))
        .filter((m): m is { method: FooterPaymentMethod; imageUrl: string | null | undefined } => m.method !== undefined)
    : SHIPPING_COURIERS.map((m) => ({ method: m, imageUrl: null }));

  // ── Legal ──────────────────────────────────────────────────────────────────
  const legalHeading = s.footer_legal_heading ?? t("footer.termsConditions");
  const legalShowCms = s.footer_legal_show_cms !== "false";
  const legalCustomLinks = parseLinkJson(s.footer_legal_links);

  const PAGE_LABELS: Record<string, string> = {
    about:                  t("footer.aboutUs"),
    "privacy-policy":       t("footer.privacyPolicy"),
    "terms-conditions":     t("footer.termsConditions"),
    "shipping-info":        t("footer.shippingPolicy"),
    "return-policy":        t("footer.returnPolicy"),
    "intellectual-property": t("footer.intellectualProperty"),
  };

  const legalLinks: LinkItem[] = [
    ...(legalShowCms ? infoPages.map((p) => ({ label: PAGE_LABELS[p.slug] ?? p.title, href: pageHref(p.slug) })) : []),
    ...legalCustomLinks,
  ];

  return (
    <footer className="bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 md:gap-x-8 md:gap-y-8">

          {/* Brand — kolom desktop */}
          <div className="hidden md:block">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="HAGE CLUB" className="h-10 sm:h-12 w-auto object-contain mb-2" />
            ) : (
              <p className="text-xl font-bold tracking-[0.15em] mb-2">HAGE CLUB</p>
            )}
            <p className="text-sm text-white/60 leading-relaxed">{tagline}</p>
            {social.length > 0 && (
              <ul className="flex items-center gap-4 mt-4">
                {social.map((sl) => (
                  <li key={sl.id}>
                    <a
                      href={sl.url}
                      target={sl.url.startsWith("mailto:") ? undefined : "_blank"}
                      rel={sl.url.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                      aria-label={sl.label || sl.platform}
                      className="block w-5 h-5 text-white/60 hover:text-white transition-colors"
                    >
                      <SocialIcon platform={sl.platform} icon={sl.icon} label={sl.label || sl.platform} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Navigasi */}
          <FooterSection heading={navHeading}>
            {navLinks.length > 0 && (
              <ul className="space-y-2">
                {navLinks.map((l) => (
                  <FooterLink key={l.href + l.label} href={l.href} label={l.label} />
                ))}
              </ul>
            )}
          </FooterSection>

          {/* Payment & Shipping — satu kolom desktop, dua accordion mobile */}
          <div className="md:space-y-6">
            <FooterSection heading={paymentHeading}>
              <ul className="flex flex-wrap gap-2">
                {paymentMethods.map(({ method, imageUrl }) => (
                  <li key={method.id}>
                    <PaymentBadge method={method} imageUrl={imageUrl} />
                  </li>
                ))}
              </ul>
            </FooterSection>

            <FooterSection heading={shippingHeading}>
              <ul className="flex flex-wrap gap-2">
                {shippingMethods.map(({ method, imageUrl }) => (
                  <li key={method.id}>
                    <PaymentBadge method={method} imageUrl={imageUrl} />
                  </li>
                ))}
              </ul>
            </FooterSection>
          </div>

          {/* Legal */}
          <FooterSection heading={legalHeading}>
            {legalLinks.length > 0 && (
              <ul className="space-y-2">
                {legalLinks.map((l) => (
                  <FooterLink key={l.href + l.label} href={l.href} label={l.label} />
                ))}
              </ul>
            )}
          </FooterSection>
        </div>

        {/* Mobile: logo kiri + social kanan, sejajar vertikal, sebelum copyright */}
        <div className="md:hidden flex items-center justify-between gap-4 pt-8">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="HAGE CLUB" className="h-16 sm:h-20 w-auto object-contain" />
          ) : (
            <p className="text-3xl font-bold tracking-[0.15em]">HAGE CLUB</p>
          )}
          {social.length > 0 && (
            <ul className="flex items-center gap-5">
              {social.map((sl) => (
                <li key={sl.id}>
                  <a
                    href={sl.url}
                    target={sl.url.startsWith("mailto:") ? undefined : "_blank"}
                    rel={sl.url.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                    aria-label={sl.label || sl.platform}
                    className="block w-6 h-6 text-white/60 hover:text-white transition-colors"
                  >
                    <SocialIcon platform={sl.platform} icon={sl.icon} label={sl.label || sl.platform} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <p>© {year} {copyrightTxt}</p>
          <div className="flex items-center gap-4">
            <LanguageSwitcher variant="text" />
            <span>{madeWithCare}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  const isExternal = href.startsWith("http");
  return (
    <li>
      <Link
        href={href}
        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="text-sm text-white/70 hover:text-white transition-colors"
      >
        {label}
      </Link>
    </li>
  );
}
