import type { Metadata } from "next";
import { getQrislySettings } from "@/lib/komerce-qrisly";
import { getAllSettings } from "@/lib/settings";
import { DEFAULT_QRISLY_BASE_URL } from "@/lib/komerce-qrisly-constants";
import { QrislySettingsForm } from "./qrisly-settings-form";

export const metadata: Metadata = { title: "QRISLY — API Settings" };

export const dynamic = "force-dynamic";

export default async function QrislySettingsPage() {
  const [config, all] = await Promise.all([
    getQrislySettings(),
    getAllSettings(),
  ]);

  const field = (key: string, fallback = "") => {
    const row = all.find((s) => s.key === key);
    if (!row) return { label: key, hint: "", isSecret: false, hasValue: false, value: fallback };
    return {
      label: row.label ?? key,
      hint: row.hint ?? "",
      isSecret: row.isSecret ?? false,
      hasValue: Boolean(row.value),
      value: row.isSecret && row.value ? "••••••••" : (row.value ?? fallback),
    };
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const webhookUrl = appUrl ? `${appUrl}/api/payments/qrisly/webhook` : "";

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight">QRISLY</h1>
        <p className="text-sm text-muted mt-1">
          Ubah QRIS statis milik toko menjadi QRIS dinamis per transaksi (nominal &amp; masa berlaku
          otomatis). API key &amp; upload QRIS dikelola dari halaman ini.
        </p>
      </div>

      <QrislySettingsForm
        initial={{
          apiKey: field("qrisly_api_key"),
          // value = base URL hasil resolve runtime (shared komerce_environment wins),
          // bukan row DB mentah — agar form mencerminkan env yang benar-benar aktif
          baseUrl: {
            ...field("qrisly_base_url", DEFAULT_QRISLY_BASE_URL),
            value: config.baseUrl,
          },
          qrisId: field("qrisly_qris_id"),
          merchantName: field("qrisly_merchant_name"),
          provider: field("qrisly_provider"),
        }}
        webhookUrl={webhookUrl}
        saved={{
          hasApiKey: Boolean(config.apiKey),
          hasBaseUrl: Boolean(config.baseUrl),
          hasQrisId: Boolean(config.qrisId),
          baseUrl: config.baseUrl,
          qrisId: config.qrisId,
        }}
      />
    </div>
  );
}
