import type { Metadata } from "next";
import { getRajaOngkirSettings, DEFAULT_BASE_URL } from "@/lib/rajaongkir";
import { getAllSettings } from "@/lib/settings";
import { RajaOngkirSettingsForm } from "./rajaongkir-settings-form";

export const metadata: Metadata = { title: "RajaOngkir — API Settings" };

export const dynamic = "force-dynamic";

export default async function RajaOngkirSettingsPage() {
  const [config, all] = await Promise.all([getRajaOngkirSettings(), getAllSettings()]);

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

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight">RajaOngkir — Cek Ongkir (Shipping Cost)</h1>
        <p className="text-sm text-muted mt-1">
          Konfigurasi API shipping cost untuk checkout &amp; estimasi ongkir di toko.
          API key didapat dari dashboard rajaongkir.com — semua pengaturan dikelola dari halaman ini
          dan aktif langsung tanpa restart server.
        </p>
      </div>

      <RajaOngkirSettingsForm
        initial={{
          apiKey: field("rajaongkir_api_key"),
          baseUrl: field("rajaongkir_base_url", DEFAULT_BASE_URL),
          originCityId: field("rajaongkir_origin_city_id"),
          originLabel: field("rajaongkir_origin_label"),
          couriers: field("rajaongkir_couriers", "jne,jnt,sicepat"),
          webhookSecret: field("rajaongkir_webhook_secret"),
        }}
        webhookUrl={webhookUrl}
        saved={{
          hasApiKey: Boolean(config.apiKey),
          baseUrl: config.baseUrl,
          originCityId: config.originCityId,
          originLabel: config.originLabel,
          couriers: config.couriers,
        }}
      />
    </div>
  );
}
