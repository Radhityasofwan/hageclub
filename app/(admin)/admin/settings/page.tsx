import type { Metadata } from "next";
import { getAllSettings } from "@/lib/settings";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Analytics & WhatsApp" };

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const raw = await getAllSettings();

  // Mask secret values before passing to client
  const settings = raw.map((s) => ({
    key: s.key,
    group: s.group,
    label: s.label,
    hint: s.hint ?? "",
    isSecret: s.isSecret,
    value: s.isSecret && s.value ? "••••••••" : (s.value ?? ""),
    hasValue: s.isSecret ? Boolean(s.value) : undefined,
    updatedAt: s.updatedAt.toISOString(),
  }));

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight">Analytics &amp; WhatsApp</h1>
        <p className="text-sm text-muted mt-1">
          Pengaturan non-API: analytics (GA4, Meta Pixel, Google Search Console) dan tombol
          WhatsApp mengambang di halaman publik. Layanan API (RajaOngkir, Pengiriman, Pembayaran,
          QRISLY) masing-masing dikelola di menu settings-nya sendiri.
        </p>
      </div>

      <SettingsForm settings={settings} />
    </div>
  );
}
