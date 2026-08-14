import type { Metadata } from "next";
import { getSettingValues } from "@/lib/settings";
import { StoreSettingsForm } from "./store-settings-form";

export const metadata: Metadata = { title: "Pengaturan Toko" };
export const dynamic = "force-dynamic";

export default async function StoreSettingsPage() {
  const settings = await getSettingValues([
    "store_free_shipping_threshold",
    "store_free_shipping_regions",
  ]);

  let freeShippingRegions: string[] = [];
  try {
    const raw = settings.store_free_shipping_regions;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) freeShippingRegions = parsed.filter((k) => typeof k === "string");
    }
  } catch {
    // ignore malformed
  }

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight">Pengaturan Toko</h1>
        <p className="text-sm text-muted mt-1">
          Konfigurasi aturan pengiriman dan belanja toko.
        </p>
      </div>

      <StoreSettingsForm
        freeShippingThreshold={settings.store_free_shipping_threshold ?? "500000"}
        freeShippingRegions={freeShippingRegions}
      />
    </div>
  );
}
