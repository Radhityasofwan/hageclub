import type { Metadata } from "next";
import { getKomshipSettings } from "@/lib/komship";
import { getAllSettings } from "@/lib/settings";
import { DEFAULT_KOMSHIP_BASE_URL } from "@/lib/komship-constants";
import { KomshipSettingsForm } from "./komship-settings-form";

export const metadata: Metadata = { title: "Pengiriman (Komship) — API Settings" };

export const dynamic = "force-dynamic";

export default async function KomshipSettingsPage() {
  const [config, all] = await Promise.all([getKomshipSettings(), getAllSettings()]);

  const field = (key: string, fallback = "") => {
    const row = all.find((s) => s.key === key);
    if (!row) return { label: key, hint: "", isSecret: false, hasValue: false, value: fallback };
    return {
      label: row.label ?? key,
      hint: row.hint ?? "",
      isSecret: row.isSecret ?? false,
      hasValue: row ? Boolean(row.value) : false,
      value: row.isSecret && row.value ? "••••••••" : (row.value ?? fallback),
    };
  };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const webhookUrl = baseUrl ? `${baseUrl}/api/shipping/webhook` : "";

  const profileComplete = Boolean(
    config.brandName && config.shipperName && config.shipperPhone &&
    config.shipperEmail && config.shipperAddress && config.shipperDestinationId
  );

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight">Pengiriman (Komship) — Shipping Delivery</h1>
        <p className="text-sm text-muted mt-1">
          Buat &amp; kelola pengiriman nyata: store order, pickup, label, dan tracking via Komship API
          (Komerce). API key didapat dari dashboard Komerce — semua pengaturan dikelola dari halaman ini.
        </p>
      </div>

      <KomshipSettingsForm
        initial={{
          apiKey: field("komship_api_key"),
          // value = base URL hasil resolve runtime (shared komerce_environment wins),
          // bukan row DB mentah — agar form mencerminkan env yang benar-benar aktif
          baseUrl: {
            ...field("komship_base_url", DEFAULT_KOMSHIP_BASE_URL),
            value: config.baseUrl,
          },
          brandName: field("komship_brand_name"),
          shipperName: field("komship_shipper_name"),
          shipperPhone: field("komship_shipper_phone"),
          shipperEmail: field("komship_shipper_email"),
          shipperDestinationId: field("komship_shipper_destination_id"),
          shipperAddress: field("komship_shipper_address"),
          originPinPoint: field("komship_origin_pin_point"),
          defaultPickupVehicle: field("komship_default_pickup_vehicle", "Motor"),
          commodityCode: field("komship_commodity_code"),
        }}
        webhookUrl={webhookUrl}
        saved={{
          hasApiKey: Boolean(config.apiKey),
          hasBaseUrl: Boolean(config.baseUrl),
          profileComplete,
          baseUrl: config.baseUrl,
          shipperDestinationId: config.shipperDestinationId,
        }}
      />
    </div>
  );
}
