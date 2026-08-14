import type { Metadata } from "next";
import { getKomercePaymentSettings } from "@/lib/komerce-payment";
import { getAllSettings } from "@/lib/settings";
import { DEFAULT_KOMERCE_PAYMENT_BASE_URL } from "@/lib/komerce-payment-constants";
import { KomercePaymentSettingsForm } from "./komerce-payment-settings-form";

export const metadata: Metadata = { title: "Pembayaran (Komerce Payment) — API Settings" };

export const dynamic = "force-dynamic";

export default async function KomercePaymentSettingsPage() {
  const [config, all] = await Promise.all([
    getKomercePaymentSettings(),
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
  const webhookUrl = appUrl ? `${appUrl}/api/payments/webhook` : "";

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight">Pembayaran (Komerce Payment)</h1>
        <p className="text-sm text-muted mt-1">
          Terima pembayaran Virtual Account (VA) &amp; QRIS via Komerce Payment API. API key
          didapat dari Merchant Dashboard Komerce — semua pengaturan dikelola dari halaman ini.
        </p>
      </div>

      <KomercePaymentSettingsForm
        initial={{
          apiKey: field("komerce_payment_api_key"),
          // value = base URL hasil resolve runtime (shared komerce_environment wins),
          // bukan row DB mentah — agar form mencerminkan env yang benar-benar aktif
          baseUrl: {
            ...field("komerce_payment_base_url", DEFAULT_KOMERCE_PAYMENT_BASE_URL),
            value: config.baseUrl,
          },
          callbackApiKey: field("komerce_payment_callback_api_key"),
          expiryDuration: field("komerce_payment_expiry_duration", "86400"),
          vaBanks: field("payment_va_banks", "BCA,BNI,BRI,MANDIRI"),
        }}
        webhookUrl={webhookUrl}
        saved={{
          hasApiKey: Boolean(config.apiKey),
          hasBaseUrl: Boolean(config.baseUrl),
          hasCallbackApiKey: Boolean(config.callbackApiKey),
          baseUrl: config.baseUrl,
        }}
      />
    </div>
  );
}
