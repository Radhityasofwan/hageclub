import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getSettingValues } from "@/lib/settings";
import { PAYMENT_METHODS, SHIPPING_COURIERS } from "@/lib/footer-catalog";
import { FooterSettingsForm } from "./footer-settings-form";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pengaturan Footer" };

function parseLinkJson(raw: string | null): { label: string; href: string }[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function parseSocialJson(raw: string | null): { id: string; platform: string; label: string; url: string; icon: string | null }[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function parseMethodJson(raw: string | null): { id: string; imageUrl?: string | null }[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export default async function FooterSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/admin");

  const s = await getSettingValues([
    "footer_tagline",
    "footer_copyright",
    "footer_made_with_care",
    "footer_social_links",
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
  ]);

  // Belum pernah diatur → semua metode aktif; sudah diatur (mungkin kosong) → pakai isinya
  const paymentMethods = s.footer_payment_methods
    ? parseMethodJson(s.footer_payment_methods)
    : PAYMENT_METHODS.map((m) => ({ id: m.id, imageUrl: null }));
  const shippingCouriers = s.footer_shipping_couriers
    ? parseMethodJson(s.footer_shipping_couriers)
    : SHIPPING_COURIERS.map((m) => ({ id: m.id, imageUrl: null }));

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Pengaturan Footer</h1>
        <p className="text-sm text-muted mt-1">
          Atur konten footer — brand, navigasi, logo pembayaran & ekspedisi, dan halaman legal.
        </p>
      </div>

      <FooterSettingsForm
        // Brand
        tagline={s.footer_tagline ?? ""}
        copyright={s.footer_copyright ?? "HAGE CLUB. All rights reserved."}
        madeWithCare={s.footer_made_with_care ?? "Dibuat dengan cinta di Indonesia"}
        socialLinks={parseSocialJson(s.footer_social_links)}
        // Navigasi — initial kosong → save mengirim null → fallback t() per locale
        navHeading={s.footer_nav_heading ?? ""}
        navShowProducts={s.footer_nav_show_products !== "false"}
        navShowCategories={s.footer_nav_show_categories !== "false"}
        navLinks={parseLinkJson(s.footer_nav_links)}
        // Payment & Shipping
        paymentHeading={s.footer_payment_heading ?? ""}
        paymentMethods={paymentMethods}
        shippingHeading={s.footer_shipping_heading ?? ""}
        shippingCouriers={shippingCouriers}
        // Legal
        legalHeading={s.footer_legal_heading ?? ""}
        legalShowCms={s.footer_legal_show_cms !== "false"}
        legalLinks={parseLinkJson(s.footer_legal_links)}
      />
    </div>
  );
}
