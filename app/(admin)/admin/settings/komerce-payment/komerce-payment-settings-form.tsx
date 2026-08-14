"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  KOMERCE_PAYMENT_ENVIRONMENTS,
  KOMERCE_PAYMENT_MIN_AMOUNT,
} from "@/lib/komerce-payment-constants";
import type { KomercePaymentMethod } from "@/types";

interface FieldInit {
  label: string;
  hint: string;
  isSecret: boolean;
  hasValue: boolean;
  value: string;
}

interface Props {
  initial: {
    apiKey: FieldInit;
    baseUrl: FieldInit;
    callbackApiKey: FieldInit;
    expiryDuration: FieldInit;
    vaBanks: FieldInit;
  };
  webhookUrl: string;
  saved: {
    hasApiKey: boolean;
    hasBaseUrl: boolean;
    hasCallbackApiKey: boolean;
    baseUrl: string;
  };
}

type TestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; message: string; methods: KomercePaymentMethod[] }
  | { status: "error"; message: string };

const inputCls =
  "w-full h-9 border border-border rounded-sm px-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary bg-white";

export function KomercePaymentSettingsForm({ initial, webhookUrl, saved }: Props) {
  const [apiKey, setApiKey] = useState(initial.apiKey.value);
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl.value || saved.baseUrl);
  const [callbackApiKey, setCallbackApiKey] = useState(initial.callbackApiKey.value);
  const [vaBanks, setVaBanks] = useState(initial.vaBanks.value);
  const [revealKey, setRevealKey] = useState(false);
  const [revealCallback, setRevealCallback] = useState(false);

  // Expiry VA — disimpan dalam detik, ditampilkan dalam menit.
  // Min 1 jam sesuai dokumen — nilai lama (<60 menit) dipaksakan ke 60.
  const [expiryMinutes, setExpiryMinutes] = useState(() => {
    const seconds = Number(initial.expiryDuration.value || "3600");
    return String(Math.max(60, Math.round(seconds / 60)));
  });

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [testState, setTestState] = useState<TestState>({ status: "idle" });
  const [methodsLoading, setMethodsLoading] = useState(false);
  const [methodsError, setMethodsError] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const env = Object.values(KOMERCE_PAYMENT_ENVIRONMENTS).find((e) =>
    baseUrl.replace(/\/+$/, "") === e.baseUrl.replace(/\/+$/, "")
  );

  function selectEnvironment(url: string) {
    setBaseUrl(url);
  }

  function generateCallbackKey() {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    setCallbackApiKey(Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(""));
  }

  // Uji koneksi — pakai nilai form saat ini (belum tentu tersimpan)
  async function handleTest() {
    setTestState({ status: "loading" });
    try {
      const res = await fetch("/api/admin/komerce-payment/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey === initial.apiKey.value || apiKey === "••••••••" ? undefined : apiKey,
          baseUrl: baseUrl.trim() ? baseUrl : undefined,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const r = json.data;
        if (r.ok) {
          setTestState({ status: "ok", message: r.message, methods: r.methods ?? [] });
        } else {
          setTestState({ status: "error", message: r.message });
        }
      } else {
        setTestState({ status: "error", message: json.message ?? "Uji koneksi gagal." });
      }
    } catch {
      setTestState({ status: "error", message: "Gagal terhubung ke server." });
    }
  }

  // Muat daftar metode dari penyimpanan (pakai key tersimpan)
  async function handleLoadMethods() {
    setMethodsLoading(true);
    setMethodsError("");
    try {
      const res = await fetch("/api/admin/komerce-payment/methods");
      const json = await res.json();
      if (json.success) {
        setTestState({ status: "ok", message: "Metode pembayaran berhasil dimuat.", methods: json.data ?? [] });
      } else {
        setMethodsError(json.message ?? "Gagal memuat metode.");
      }
    } catch {
      setMethodsError("Gagal memuat metode.");
    } finally {
      setMethodsLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Derive shared environment key — menyinkronkan Payment, QRISLY, Komship sekaligus
      const envKey = (Object.keys(KOMERCE_PAYMENT_ENVIRONMENTS) as Array<keyof typeof KOMERCE_PAYMENT_ENVIRONMENTS>).find(
        (k) => KOMERCE_PAYMENT_ENVIRONMENTS[k].baseUrl.replace(/\/+$/, "") === baseUrl.replace(/\/+$/, "")
      );
      const updates = [
        { key: "komerce_payment_api_key", value: apiKey },
        { key: "komerce_payment_base_url", value: baseUrl },
        { key: "komerce_payment_callback_api_key", value: callbackApiKey },
        { key: "komerce_payment_expiry_duration", value: String(Math.max(3600, Number(expiryMinutes) * 60)) },
        { key: "payment_va_banks", value: vaBanks.trim() },
        ...(envKey ? [{ key: "komerce_environment", value: envKey }] : []),
      ];

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const json = await res.json();
      if (res.ok) {
        showToast("success", "Pengaturan disimpan.");
      } else {
        showToast("error", json.message ?? "Gagal menyimpan pengaturan.");
      }
    } catch {
      showToast("error", "Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  }

  const active = saved.hasApiKey && saved.hasBaseUrl;
  const methods = testState.status === "ok" ? testState.methods : [];
  const vaMethods = methods.filter((m) => m.paymentType === "va");
  const qrisMethod = methods.find((m) => m.paymentType === "qris");

  return (
    <div className="space-y-6">
      {/* Status card */}
      <section className="bg-white rounded-sm border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-accent/40 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Status API Pembayaran</h2>
          <span
            className={`text-xs px-2 py-1 rounded-sm font-medium ${active ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}
          >
            {active ? "Aktif — siap terima pembayaran" : "Belum lengkap"}
          </span>
        </div>
        <div className="divide-y divide-border">
          <StatusRow label="API Key" value={saved.hasApiKey ? "Terisi" : "Belum diisi"} ok={saved.hasApiKey} />
          <StatusRow
            label="Environment"
            value={env ? `${env.label} (${env.baseUrl})` : (saved.hasBaseUrl ? saved.baseUrl : "Belum diatur")}
            ok={saved.hasBaseUrl}
            mono
          />
          <StatusRow
            label="Callback API Key"
            value={saved.hasCallbackApiKey ? "Terisi (verifikasi webhook aktif)" : "Belum diisi (webhook nonaktif)"}
            ok={saved.hasCallbackApiKey}
          />
        </div>
      </section>

      {/* ============ Environment ============ */}
      <section className="bg-white rounded-sm border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-accent/40">
          <h2 className="text-sm font-semibold">Environment</h2>
          <p className="text-xs text-muted mt-0.5">
            Sandbox untuk uji coba (pembayaran disimulasikan), Production untuk transaksi sungguhan.
            Gunakan API key yang sesuai dengan environment.{" "}
            <span className="text-primary font-medium">⚡ Mengubah environment di sini menyinkronkan Payment, QRISLY, dan Komship sekaligus.</span>
          </p>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(Object.keys(KOMERCE_PAYMENT_ENVIRONMENTS) as Array<keyof typeof KOMERCE_PAYMENT_ENVIRONMENTS>).map((key) => {
              const e = KOMERCE_PAYMENT_ENVIRONMENTS[key];
              const isActive = baseUrl.replace(/\/+$/, "") === e.baseUrl.replace(/\/+$/, "");
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectEnvironment(e.baseUrl)}
                  className={`text-left px-4 py-3 border rounded-sm transition-colors ${isActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                >
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isActive ? "bg-primary" : "bg-border"}`} />
                    {e.label}
                  </p>
                  <p className="text-[11px] text-muted mt-1">{e.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ Kredensial ============ */}
      <section className="bg-white rounded-sm border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-accent/40">
          <h2 className="text-sm font-semibold">Kredensial API</h2>
          <p className="text-xs text-muted mt-0.5">
            API key dari Merchant Dashboard Komerce (produk Payment Service). Dikirim sebagai header{" "}
            <code className="bg-accent px-1 rounded-sm">x-api-key</code>.
          </p>
        </div>

        <FieldBlock label="API Key" hint={initial.apiKey.hint} badge={initial.apiKey.isSecret ? "secret" : undefined}>
          <div className="relative">
            <input
              type={revealKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Masukkan API key Payment..."
              className={`${inputCls} pr-10`}
            />
            <button
              type="button"
              onClick={() => setRevealKey((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
              aria-label={revealKey ? "Sembunyikan API key" : "Tampilkan API key"}
            >
              <IconEye />
            </button>
          </div>
        </FieldBlock>

        <FieldBlock label="Base URL">
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className={inputCls}
          />
          <p className="text-[11px] text-muted mt-1.5">
            Otomatis terisi saat memilih environment di atas. Ubah manual bila perlu.
          </p>
        </FieldBlock>

        <FieldBlock
          label="Callback API Key"
          hint="Secret key untuk verifikasi callback pembayaran (HMAC-SHA256). Generate sendiri — dikirim ke Komerce di payload create sebagai callback_api_key, dan dipakai memverifikasi header X-Callback-Api-Key saat callback masuk. Wajib diisi agar webhook aktif."
          badge={initial.callbackApiKey.isSecret ? "secret" : undefined}
        >
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={revealCallback ? "text" : "password"}
                value={callbackApiKey}
                onChange={(e) => setCallbackApiKey(e.target.value)}
                placeholder="Kosong = webhook nonaktif (status via polling)"
                className={`${inputCls} pr-10`}
              />
              <button
                type="button"
                onClick={() => setRevealCallback((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
                aria-label={revealCallback ? "Sembunyikan callback key" : "Tampilkan callback key"}
              >
                <IconEye />
              </button>
            </div>
            <button
              type="button"
              onClick={generateCallbackKey}
              className="h-9 shrink-0 px-3 border border-border rounded-sm text-xs font-medium hover:border-primary hover:text-primary transition-colors"
            >
              Generate
            </button>
          </div>
          <p className="text-[11px] text-muted mt-1.5">
            Simpan key ini — key tidak bisa dilihat lagi setelah disimpan (hanya masker).
          </p>
        </FieldBlock>

        <FieldBlock label="Masa Berlaku VA" hint="Durasi Virtual Account berlaku sebelum kedaluwarsa — minimal 1 jam sesuai dokumen Komerce. QRIS (Payment Service) selalu 5 menit (fixed di server, tidak bisa diubah); QRISLY tetap 15 menit.">
          <select
            value={expiryMinutes}
            onChange={(e) => setExpiryMinutes(e.target.value)}
            className="w-full h-9 border border-border rounded-sm px-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {[
              { v: "60",   l: "1 jam (minimal)" },
              { v: "120",  l: "2 jam" },
              { v: "360",  l: "6 jam" },
              { v: "720",  l: "12 jam" },
              { v: "1440", l: "24 jam" },
            ].map(({ v, l }) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </FieldBlock>

        <FieldBlock
          label="Bank VA Default"
          hint="Bank yang dipakai saat checkout Virtual Account (kode, pisahkan koma). Bank pertama dipakai sebagai default. Contoh: BCA,BNI,BRI,MANDIRI"
        >
          <input
            type="text"
            value={vaBanks}
            onChange={(e) => setVaBanks(e.target.value)}
            placeholder="BCA,BNI,BRI,MANDIRI"
            className={inputCls}
          />
        </FieldBlock>

        {/* Hasil uji koneksi / daftar metode */}
        {testState.status === "ok" && (
          <div className="px-6 py-3 border-t border-border bg-success/5 text-xs">
            <p className="font-medium text-success">✓ {testState.message}</p>
            {methods.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {vaMethods.map((m) => (
                  <span key={m.bankCode} className="px-2 py-1 bg-white border border-border rounded-sm font-medium">
                    {m.bankCode}
                  </span>
                ))}
                {qrisMethod && (
                  <span className="px-2 py-1 bg-white border border-border rounded-sm font-medium">QRIS</span>
                )}
              </div>
            )}
          </div>
        )}
        {testState.status === "error" && (
          <div className="px-6 py-3 border-t border-border bg-destructive/5 text-xs text-destructive">
            ✕ {testState.message}
          </div>
        )}
        {methodsError && (
          <div className="px-6 py-3 border-t border-border bg-destructive/5 text-xs text-destructive">
            ✕ {methodsError}
          </div>
        )}

        <div className="px-6 py-3 border-t border-border flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleTest}
            disabled={testState.status === "loading"}
            className="flex items-center gap-2 h-8 px-4 border border-border rounded-sm text-xs font-medium hover:border-primary hover:text-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {testState.status === "loading" ? (
              <>
                <span className="w-3 h-3 border border-muted border-r-transparent rounded-full animate-spin" />
                Menguji...
              </>
            ) : (
              "Uji Koneksi"
            )}
          </button>
          <button
            type="button"
            onClick={handleLoadMethods}
            disabled={methodsLoading || !active}
            className="flex items-center gap-2 h-8 px-4 border border-border rounded-sm text-xs font-medium hover:border-primary hover:text-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {methodsLoading ? "Memuat..." : "Muat Metode Pembayaran"}
          </button>
          <p className="text-[11px] text-muted ml-auto">
            Uji memakai nilai form saat ini — menampilkan daftar bank VA &amp; QRIS.
          </p>
        </div>
      </section>

      {/* ============ Webhook ============ */}
      {webhookUrl && (
        <section className="bg-white rounded-sm border border-border overflow-hidden">
          <div className="px-6 py-3 border-b border-border bg-info/5 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted mb-1">Callback URL (webhook)</p>
              <p className="text-xs font-mono text-primary truncate select-all">{webhookUrl}</p>
              <p className="text-[10px] text-muted mt-0.5">
                URL ini dikirim ke Komerce di setiap transaksi (callback_url) selama Callback API Key
                terisi. Komerce mengirim notifikasi status pembayaran (PAID, EXPIRED, dll.) — verifikasi
                HMAC otomatis di server.
              </p>
            </div>
            <CopyButton text={webhookUrl} />
          </div>
        </section>
      )}

      {/* ============ Simpan ============ */}
      <div className="flex items-center justify-between bg-accent/40 border border-border rounded-sm px-4 py-3">
        <p className="text-xs text-muted">
          Perubahan langsung aktif setelah disimpan (tidak perlu restart server). Transaksi minimal{" "}
          {KOMERCE_PAYMENT_MIN_AMOUNT.toLocaleString("id-ID")} IDR.
        </p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 h-9 px-5 bg-primary text-white text-xs font-medium rounded-sm hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <>
              <span className="w-3 h-3 border border-white border-r-transparent rounded-full animate-spin" />
              Menyimpan...
            </>
          ) : (
            "Simpan Pengaturan"
          )}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-sm shadow-lg text-sm ${toast.type === "success" ? "bg-primary text-white" : "bg-destructive text-white"}`}
        >
          {toast.message}
        </div>
      )}

      {/* ============ Panduan ============ */}
      <section className="rounded-sm border border-border bg-white">
        <div className="px-4 py-3 border-b border-border bg-accent/40 flex items-center justify-between">
          <p className="text-xs font-semibold text-primary">Panduan Lengkap (dokumentasi resmi Komerce Payment)</p>
          <span className="text-[10px] text-muted uppercase tracking-wide">klik untuk membuka</span>
        </div>
        <div className="p-4 space-y-3">
          <div className="bg-accent/50 rounded-sm p-3 text-xs text-muted space-y-1">
            <p className="font-medium text-primary">Langkah singkat:</p>
            <p>1. Daftar/login di Merchant Dashboard Komerce, aktifkan produk Payment Service, salin API key.</p>
            <p>2. Tempel API key di atas, pilih environment <b>Sandbox</b> dulu, tekan <b>Uji Koneksi</b> — pastikan hasilnya &quot;Koneksi berhasil&quot;.</p>
            <p>3. Tekan <b>Generate</b> untuk Callback API Key (wajib agar pembayaran terverifikasi otomatis via webhook).</p>
            <p>4. Tekan <b>Simpan Pengaturan</b> — checkout otomatis memakai metode VA &amp; QRIS.</p>
            <p className="text-warning">⚠ Untuk Production: lengkapi dulu verifikasi merchant di dashboard Komerce (KTP, NPWP, rekening bank) — tanpa itu API Production mengembalikan error 403 &quot;Please complete the documents first&quot;. Gunakan Sandbox selama proses verifikasi.</p>
          </div>

          <GuideSection title="Cara Mendapatkan API Key">
            <p>1. Buka dashboard Komerce dan login ke akun merchant Anda.</p>
            <p>2. Aktifkan produk <b>Payment Service</b> (VA &amp; QRIS).</p>
            <p>3. Salin <b>API key</b> dari dashboard (key produk payment — bukan key produk shipping).</p>
            <p>4. Tempel di kolom <b>API Key</b> halaman ini, tekan <b>Uji Koneksi</b>, lalu <b>Simpan Pengaturan</b>.</p>
            <p className="text-warning">Catatan: gunakan key <b>sandbox</b> untuk uji coba dan key <b>production</b> untuk transaksi nyata — jangan dicampur. API key tidak boleh bocor ke sisi client (kode publik).</p>
          </GuideSection>

          <GuideSection title="Alur Pembayaran (sesuai dokumen)">
            <ul className="list-disc pl-4 space-y-1">
              <li><code className="bg-accent px-1 rounded-sm">GET /methods</code> — ambil daftar bank VA (BCA, Mandiri, dll) + ketersediaan QRIS. Cache 1 jam.</li>
              <li><code className="bg-accent px-1 rounded-sm">POST /payment/create</code> — buat transaksi VA (dengan channel_code) atau QRIS (tanpa channel_code).</li>
              <li>Customer bayar via bank transfer / scan QRIS — status ter-update otomatis.</li>
              <li><code className="bg-accent px-1 rounded-sm">GET /payment/status/&#123;payment_id&#125;</code> — cek status (PENDING, PAID, EXPIRED, CANCELED). Maks 1 request / 3 detik per payment_id.</li>
            </ul>
          </GuideSection>

          <GuideSection title="Parameter Create Payment">
            <div className="space-y-1.5">
              <p><b>order_id</b> (wajib) — maks 100 karakter. Di sini memakai nomor order toko.</p>
              <p><b>payment_type</b> — <b>bank_transfer</b> (VA) atau <b>qris</b>.</p>
              <p><b>channel_code</b> — wajib untuk bank_transfer (kode bank valid dari /methods), <b>tidak perlu</b> untuk QRIS.</p>
              <p><b>amount</b> — wajib, <b>minimal Rp 10.000</b>.</p>
              <p><b>expiry_duration</b> — detik, hanya untuk VA, <b>minimal 3600 (1 jam)</b> sesuai dokumen. QRIS fixed 300 (5 menit). Nilai dikontrol dari pengaturan Masa Berlaku VA di atas.</p>
              <p><b>customer</b> — name, email (valid), phone. <b>items</b> — name, quantity, price.</p>
              <p><b>callback_url + callback_api_key</b> — wajib berpasangan; api key dikirim sebagai secret HMAC.</p>
              <p className="text-muted">Header wajib: <code className="bg-accent px-1 rounded-sm">x-api-key</code> (dan Content-Type: application/json).</p>
            </div>
          </GuideSection>

          <GuideSection title="Verifikasi Callback (HMAC-SHA256)">
            <p>Dokumen §6 — Komerce menandatangani setiap notifikasi dengan HMAC-SHA256:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Ambil <b>raw JSON body</b> persis seperti terkirim (tanpa di-parse/format ulang).</li>
              <li>Baca header <code className="bg-accent px-1 rounded-sm">X-Callback-Api-Key</code> — berisi signature, bukan key asli.</li>
              <li>Hash raw body dengan HMAC-SHA256, secret = <b>Callback API Key</b> milik Anda.</li>
              <li>Cocokkan — cocok → proses &amp; balas 200; tidak cocok → tolak 401/403.</li>
            </ol>
            <p className="text-muted">Sudah diterapkan di endpoint <code className="bg-accent px-1 rounded-sm">/api/payments/webhook</code>. Callback key bisa di-generate tombol <b>Generate</b> di atas.</p>
          </GuideSection>

          <GuideSection title="Biaya (Pricing)">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-accent/60 text-left">
                    <th className="px-2 py-1.5 border border-border font-semibold">Metode</th>
                    <th className="px-2 py-1.5 border border-border font-semibold">Struktur Fee</th>
                    <th className="px-2 py-1.5 border border-border font-semibold">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="text-muted">
                  <tr>
                    <td className="px-2 py-1.5 border border-border">Virtual Account (VA)</td>
                    <td className="px-2 py-1.5 border border-border">Flat Rp 4.440 / transaksi</td>
                    <td className="px-2 py-1.5 border border-border">Sudah termasuk PPN</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1.5 border border-border">QRIS</td>
                    <td className="px-2 py-1.5 border border-border">0,99% per transaksi</td>
                    <td className="px-2 py-1.5 border border-border">Sudah termasuk PPN</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>Fee dipotong dari settlement — <b>bukan</b> dari total yang dibayar customer. Tidak ada biaya aktivasi API.</p>
          </GuideSection>

          <GuideSection title="Kode Error &amp; Solusi">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-accent/60 text-left">
                    <th className="px-2 py-1.5 border border-border font-semibold">Kode</th>
                    <th className="px-2 py-1.5 border border-border font-semibold">Arti</th>
                    <th className="px-2 py-1.5 border border-border font-semibold">Solusi</th>
                  </tr>
                </thead>
                <tbody className="text-muted">
                  <tr>
                    <td className="px-2 py-1.5 border border-border font-mono">200</td>
                    <td className="px-2 py-1.5 border border-border">Sukses</td>
                    <td className="px-2 py-1.5 border border-border">—</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1.5 border border-border font-mono">400</td>
                    <td className="px-2 py-1.5 border border-border">Parameter tidak valid</td>
                    <td className="px-2 py-1.5 border border-border">Cek amount ≥ 10.000, channel_code bank valid, expiry_duration valid</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1.5 border border-border font-mono">401</td>
                    <td className="px-2 py-1.5 border border-border">Unauthorized (API key salah)</td>
                    <td className="px-2 py-1.5 border border-border">Periksa key di dashboard — pastikan tanpa spasi ekstra, dan key environment sesuai</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1.5 border border-border font-mono">403</td>
                    <td className="px-2 py-1.5 border border-border">Dokumen merchant belum lengkap</td>
                    <td className="px-2 py-1.5 border border-border">Lengkapi verifikasi merchant di dashboard Komerce (KTP, NPWP, rekening, dll.) sebelum bisa pakai Production. Sementara gunakan Sandbox.</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1.5 border border-border font-mono">404</td>
                    <td className="px-2 py-1.5 border border-border">payment_id tidak ditemukan</td>
                    <td className="px-2 py-1.5 border border-border">Pastikan payment_id dari respons /create atau /status</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1.5 border border-border font-mono">500</td>
                    <td className="px-2 py-1.5 border border-border">Server error</td>
                    <td className="px-2 py-1.5 border border-border">Coba lagi dengan exponential backoff; hubungi support bila berulang</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </GuideSection>

          <p className="text-[11px] text-muted pt-1 border-t border-border">
            API key &amp; callback key disimpan terenkripsi; nilai <code className="bg-accent px-1 rounded-sm">••••••••</code> berarti sudah terisi — biarkan kosong jika tidak ingin mengubah.
          </p>
        </div>
      </section>
    </div>
  );
}

// =============================================================================
// Sub-components

function GuideSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group border border-border rounded-sm overflow-hidden">
      <summary className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs font-medium text-primary cursor-pointer select-none hover:bg-accent/40 transition-colors list-none [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <svg
          className="w-3.5 h-3.5 text-muted shrink-0 transition-transform group-open:rotate-180"
          viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"
        >
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="px-3 py-3 border-t border-border text-xs text-muted space-y-1.5">
        {children}
      </div>
    </details>
  );
}
// =============================================================================

function StatusRow({ label, value, ok, mono = false }: { label: string; value: string; ok: boolean; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between px-6 py-3">
      <span className="text-xs text-muted">{label}</span>
      <span className={`text-xs ${ok ? "text-primary" : "text-muted"} ${mono ? "font-mono" : "font-medium"} truncate ml-4`}>
        {value || "—"}
      </span>
    </div>
  );
}

function FieldBlock({ label, hint, badge, children }: { label: string; hint?: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-4">
      <label className="text-sm font-medium text-primary">
        {label}
        {badge && (
          <span className="ml-2 text-[10px] text-success border border-border rounded-sm px-1 py-0.5 uppercase tracking-wide">{badge}</span>
        )}
      </label>
      {hint && <p className="text-xs text-muted mt-0.5 mb-2">{hint}</p>}
      {!hint && <div className="mt-2" />}
      {children}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }
  return (
    <button type="button" onClick={handleCopy} className="shrink-0 flex items-center gap-1.5 h-7 px-2.5 border border-border rounded-sm text-xs text-muted hover:text-primary hover:border-primary transition-colors">
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

function IconEye() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}
