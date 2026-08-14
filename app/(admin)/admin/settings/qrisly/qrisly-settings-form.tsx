"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  QRISLY_ENVIRONMENTS,
  QRISLY_MAX_FILE_SIZE,
  QRISLY_MIN_AMOUNT,
} from "@/lib/komerce-qrisly-constants";

interface FieldInit {
  label: string;
  hint: string;
  isSecret: boolean;
  hasValue: boolean;
  value: string;
}

interface UploadResult {
  qrisId: string;
  merchantName: string | null;
  provider: string | null;
  name: string;
}

interface Props {
  initial: {
    apiKey: FieldInit;
    baseUrl: FieldInit;
    qrisId: FieldInit;
    merchantName: FieldInit;
    provider: FieldInit;
  };
  webhookUrl: string;
  saved: {
    hasApiKey: boolean;
    hasBaseUrl: boolean;
    hasQrisId: boolean;
    baseUrl: string;
    qrisId: string;
  };
}

type TestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; message: string; hasQrisId: boolean }
  | { status: "error"; message: string };

const inputCls =
  "w-full h-9 border border-border rounded-sm px-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary bg-white";

export function QrislySettingsForm({ initial, webhookUrl, saved }: Props) {
  const [apiKey, setApiKey] = useState(initial.apiKey.value);
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl.value || saved.baseUrl);
  const [qrisId, setQrisId] = useState(initial.qrisId.value || saved.qrisId);
  const [revealKey, setRevealKey] = useState(false);

  const [qrisName, setQrisName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [testState, setTestState] = useState<TestState>({ status: "idle" });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const env = Object.values(QRISLY_ENVIRONMENTS).find((e) =>
    baseUrl.replace(/\/+$/, "") === e.baseUrl.replace(/\/+$/, "")
  );

  function selectEnvironment(url: string) {
    setBaseUrl(url);
  }

  function handleFileChange(file: File | null) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setUploadError("");
    setUploadResult(null);
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }
    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      setUploadError("Format file harus PNG atau JPG.");
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }
    if (file.size > QRISLY_MAX_FILE_SIZE) {
      setUploadError("Ukuran file maksimal 5MB.");
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;
    setSelectedFile(file);
    setPreviewUrl(url);
  }

  // Upload QRIS statis — pakai nilai form saat ini (key belum disimpan boleh)
  async function handleUpload() {
    if (!selectedFile || !qrisName.trim()) return;
    setUploading(true);
    setUploadError("");
    try {
      const fd = new FormData();
      fd.append("name", qrisName.trim());
      fd.append("qris_image", selectedFile);
      if (apiKey !== initial.apiKey.value && apiKey !== "••••••••") fd.append("apiKey", apiKey);
      if (baseUrl.trim()) fd.append("baseUrl", baseUrl);

      const res = await fetch("/api/admin/qrisly/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (json.success) {
        setUploadResult({
          qrisId: json.data.qrisId,
          merchantName: json.data.merchantName,
          provider: json.data.provider,
          name: json.data.name,
        });
        setQrisId(json.data.qrisId);
        showToast("success", "QRIS statis berhasil diunggah.");
      } else {
        setUploadError(json.message ?? "Upload QRIS gagal.");
      }
    } catch {
      setUploadError("Upload QRIS gagal — coba lagi.");
    } finally {
      setUploading(false);
    }
  }

  // Uji koneksi — cek validitas API key (tidak memanggil generate yang berbayar)
  async function handleTest() {
    setTestState({ status: "loading" });
    try {
      const res = await fetch("/api/admin/qrisly/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey === initial.apiKey.value || apiKey === "••••••••" ? undefined : apiKey,
          baseUrl: baseUrl.trim() ? baseUrl : undefined,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        if (json.data.ok) {
          setTestState({ status: "ok", message: json.data.message, hasQrisId: json.data.hasQrisId });
        } else {
          setTestState({ status: "error", message: json.data.message });
        }
      } else {
        setTestState({ status: "error", message: json.message ?? "Uji koneksi gagal." });
      }
    } catch {
      setTestState({ status: "error", message: "Gagal terhubung ke server." });
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Derive shared environment key — menyinkronkan Payment, QRISLY, Komship sekaligus
      const envKey = (Object.keys(QRISLY_ENVIRONMENTS) as Array<keyof typeof QRISLY_ENVIRONMENTS>).find(
        (k) => QRISLY_ENVIRONMENTS[k].baseUrl.replace(/\/+$/, "") === baseUrl.replace(/\/+$/, "")
      );
      const updates = [
        { key: "qrisly_api_key", value: apiKey },
        { key: "qrisly_base_url", value: baseUrl },
        { key: "qrisly_qris_id", value: qrisId },
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

  const active = saved.hasApiKey && saved.hasBaseUrl && saved.hasQrisId;

  return (
    <div className="space-y-6">
      {/* Status card */}
      <section className="bg-white rounded-sm border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-accent/40 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Status QRISLY</h2>
          <span
            className={`text-xs px-2 py-1 rounded-sm font-medium ${active ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}
          >
            {active ? "Aktif — QRIS dinamis siap dipakai" : "Belum lengkap"}
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
            label="QRIS Statis"
            value={saved.hasQrisId
              ? `${saved.qrisId}${initial.merchantName.value ? ` — ${initial.merchantName.value}` : ""}`
              : "Belum diupload"}
            ok={saved.hasQrisId}
            mono
          />
        </div>
      </section>

      {/* ============ Environment ============ */}
      <section className="bg-white rounded-sm border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-accent/40">
          <h2 className="text-sm font-semibold">Environment</h2>
          <p className="text-xs text-muted mt-0.5">
            Sandbox untuk uji coba, Production untuk transaksi sungguhan. Gunakan API key yang
            sesuai dengan environment.{" "}
            <span className="text-primary font-medium">⚡ Mengubah environment di sini menyinkronkan Payment, QRISLY, dan Komship sekaligus.</span>
          </p>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(Object.keys(QRISLY_ENVIRONMENTS) as Array<keyof typeof QRISLY_ENVIRONMENTS>).map((key) => {
              const e = QRISLY_ENVIRONMENTS[key];
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
            API key dari dashboard RajaOngkir (produk QRISLY). Dikirim sebagai header{" "}
            <code className="bg-accent px-1 rounded-sm">x-api-key</code>.
          </p>
        </div>

        <FieldBlock label="API Key" hint={initial.apiKey.hint} badge={initial.apiKey.isSecret ? "secret" : undefined}>
          <div className="relative">
            <input
              type={revealKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Masukkan API key QRISLY..."
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

        {/* Hasil uji koneksi */}
        {testState.status === "ok" && (
          <div className="px-6 py-3 border-t border-border bg-success/5 text-xs">
            <p className="font-medium text-success">✓ {testState.message}</p>
          </div>
        )}
        {testState.status === "error" && (
          <div className="px-6 py-3 border-t border-border bg-destructive/5 text-xs text-destructive">
            ✕ {testState.message}
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
          <p className="text-[11px] text-muted ml-auto">
            Uji memakai nilai form saat ini — cek validitas API key tanpa biaya.
          </p>
        </div>
      </section>

      {/* ============ Upload QRIS Statis ============ */}
      <section className="bg-white rounded-sm border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-accent/40">
          <h2 className="text-sm font-semibold">Upload QRIS Statis</h2>
          <p className="text-xs text-muted mt-0.5">
            Upload sekali — QRIS statis milik toko menjadi basis semua QRIS dinamis (nominal
            otomatis per pesanan). Format PNG/JPG, maks 5MB.
          </p>
        </div>

        <div className="px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="shrink-0 flex flex-col items-center gap-2">
              <label className="w-36 h-36 border-2 border-dashed border-border rounded-sm flex items-center justify-center overflow-hidden cursor-pointer bg-accent/30 hover:border-primary/60 transition-colors">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Pratinjau QRIS" className="w-full h-full object-contain p-1" />
                ) : (
                  <span className="text-[11px] text-muted px-3 text-center leading-relaxed">
                    Pilih gambar QRIS
                    <br />(PNG / JPG)
                  </span>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  if (previewUrlRef.current) {
                    URL.revokeObjectURL(previewUrlRef.current);
                    previewUrlRef.current = null;
                  }
                }}
                className="text-[11px] text-muted underline hover:text-destructive"
              >
                Hapus pilihan
              </button>
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <label className="text-xs font-medium text-primary">Nama QRIS</label>
                <input
                  type="text"
                  value={qrisName}
                  onChange={(e) => setQrisName(e.target.value)}
                  maxLength={100}
                  placeholder="mis. QRIS Toko HAGE CLUB"
                  className={`${inputCls} mt-1`}
                />
                <p className="text-[11px] text-muted mt-1">Maks 100 karakter — identitas QRIS di platform.</p>
              </div>

              {uploadError && (
                <p className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-sm px-3 py-2">
                  ✕ {uploadError}
                </p>
              )}

              {uploadResult && (
                <div className="text-xs bg-success/5 border border-success/20 rounded-sm px-3 py-2 space-y-0.5">
                  <p className="font-medium text-success">✓ QRIS berhasil diupload &amp; divalidasi</p>
                  <p className="font-mono text-muted">QRIS ID: {uploadResult.qrisId}</p>
                  {uploadResult.merchantName && <p>Merchant: {uploadResult.merchantName}</p>}
                  {uploadResult.provider && <p>Provider: {uploadResult.provider}</p>}
                </div>
              )}

              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading || !selectedFile || !qrisName.trim()}
                className="flex items-center gap-2 h-9 px-5 bg-primary text-white text-xs font-medium rounded-sm hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? (
                  <>
                    <span className="w-3 h-3 border border-white border-r-transparent rounded-full animate-spin" />
                    Mengunggah...
                  </>
                ) : (
                  "Upload & Validasi QRIS"
                )}
              </button>
              <p className="text-[11px] text-muted">
                Setelah berhasil, QRIS ID otomatis tersimpan dan semua transaksi QRIS memakainya.
              </p>
            </div>
          </div>
        </div>

        {/* QRIS ID manual (advanced) */}
        <div className="px-6 py-4 border-t border-border">
          <label className="text-xs font-medium text-primary">QRIS ID (hasil upload)</label>
          <input
            type="text"
            value={qrisId}
            onChange={(e) => setQrisId(e.target.value)}
            placeholder="Kosong sampai QRIS statis diupload"
            className={`${inputCls} mt-1`}
          />
          <p className="text-[11px] text-muted mt-1">
            Terisi otomatis saat upload. Bisa diedit manual bila QRIS sudah pernah diupload dari
            platform lain.
          </p>
        </div>
      </section>

      {/* ============ Webhook ============ */}
      {webhookUrl && (
        <section className="bg-white rounded-sm border border-border overflow-hidden">
          <div className="px-6 py-3 border-b border-border bg-info/5 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted mb-1">Webhook URL (notifikasi pembayaran)</p>
              <p className="text-xs font-mono text-primary truncate select-all">{webhookUrl}</p>
              <p className="text-[10px] text-muted mt-0.5">
                Daftarkan URL ini di dashboard RajaOngkir → Webhook → QRISLY → Outbound Webhook.
                QRISLY mengirim notifikasi saat QRIS dibayar / kedaluwarsa (retry 3× bila gagal).
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
          {QRISLY_MIN_AMOUNT.toLocaleString("id-ID")} IDR.
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
          <p className="text-xs font-semibold text-primary">Panduan Lengkap (dokumentasi resmi QRISLY)</p>
          <span className="text-[10px] text-muted uppercase tracking-wide">klik untuk membuka</span>
        </div>
        <div className="p-4 space-y-3">
          <div className="bg-accent/50 rounded-sm p-3 text-xs text-muted space-y-1">
            <p className="font-medium text-primary">Langkah singkat:</p>
            <p>1. Daftar/login di dashboard RajaOngkir, aktifkan produk QRISLY, salin API key.</p>
            <p>2. Tempel API key di atas, pilih environment <b>Sandbox</b> dulu, tekan <b>Uji Koneksi</b>.</p>
            <p>3. Upload gambar QRIS statis toko (PNG/JPG ≤5MB) di bagian <b>Upload QRIS Statis</b> — sekali saja.</p>
            <p>4. Daftarkan webhook URL di dashboard RajaOngkir → Webhook → QRISLY → Outbound Webhook.</p>
            <p>5. Tekan <b>Simpan Pengaturan</b> — checkout QRIS otomatis memakai QRIS dinamis.</p>
          </div>

          <GuideSection title="Alur Kerja (sesuai dokumen)">
            <ul className="list-disc pl-4 space-y-1">
              <li><b>Upload sekali</b>: <code className="bg-accent px-1 rounded-sm">POST /qrisly/upload-qris</code> — kirim gambar QRIS statis toko (PNG/JPG, ≤5MB, name ≤100 char). Balasan: <code className="bg-accent px-1 rounded-sm">qris_id</code> — dipakai semua transaksi.</li>
              <li><b>Generate per order</b>: <code className="bg-accent px-1 rounded-sm">POST /qrisly/generate-qris</code> — qris_id + amount (≥ Rp 1.000) + output_type. Balasan: <code className="bg-accent px-1 rounded-sm">history_id</code> + qris_string + final_amount + expiry.</li>
              <li><b>Cek status</b>: <code className="bg-accent px-1 rounded-sm">GET /qrisly/payment-status/&#123;history_id&#125;</code> — unpaid | paid | expired | cancelled. Gratis dipanggil, simpan history_id.</li>
              <li><b>Webhook</b>: notifikasi otomatis saat status berubah — simpan history_id dari webhook.</li>
            </ul>
          </GuideSection>

          <GuideSection title="Parameter Generate QRIS">
            <div className="space-y-1.5">
              <p><b>qris_id</b> (wajib) — dari hasil upload QRIS statis.</p>
              <p><b>amount</b> (wajib) — nominal Rupiah, minimal Rp 1.000, maks Rp 100.000.000.</p>
              <p><b>output_type</b> (wajib) — <b>string</b> (untuk tampil di aplikasi) atau <b>image</b> (untuk cetak).</p>
              <p><b>unique_amount</b> (default <b>true</b>) — menambah nominal unik (+1 s.d. +999) agar pembayaran bernominal sama tetap bisa dibedakan. Jangan matikan tanpa alasan.</p>
              <p className="text-muted">Header wajib: <code className="bg-accent px-1 rounded-sm">x-api-key</code> (dan Content-Type: application/json).</p>
            </div>
          </GuideSection>

          <GuideSection title="Webhook (notifikasi status)">
            <p>Daftarkan URL ini di dashboard: Webhook → QRISLY → <b>Outbound Webhook</b> → isi URL → Save:</p>
            <p className="bg-accent/50 rounded-sm px-2 py-1.5 font-mono text-[11px] break-all">{webhookUrl || "URL webhook muncul setelah App URL terisi"}</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Event <code className="bg-accent px-1 rounded-sm">payment.success</code> — pembayaran diterima.</li>
              <li>Event <code className="bg-accent px-1 rounded-sm">payment.expired</code> — QRIS kedaluwarsa tanpa pembayaran.</li>
              <li>Payload berisi <code className="bg-accent px-1 rounded-sm">qris_history_id</code>, <code className="bg-accent px-1 rounded-sm">status</code>, amount, paid_at.</li>
              <li>Wajib balas <b>HTTP 200</b> dengan JSON <code className="bg-accent px-1 rounded-sm">&#123;&quot;success&quot;: true&#125;</code> — jika gagal, QRISLY retry 3× (1 mnt, 5 mnt, 15 mnt).</li>
            </ul>
            <p className="text-muted">Sudah diterapkan di endpoint <code className="bg-accent px-1 rounded-sm">/api/payments/qrisly/webhook</code>.</p>
          </GuideSection>

          <GuideSection title="Biaya (Pricing)">
            <ul className="list-disc pl-4 space-y-1">
              <li>Akses API — <b>Gratis</b>, tanpa biaya setup atau langganan.</li>
              <li>Per QRIS di-generate — <b>IDR 100</b> (dipotong dari balance wallet).</li>
              <li>Transaksi gagal / webhook — <b>Gratis</b>.</li>
            </ul>
          </GuideSection>

          <GuideSection title="Tips Resmi">
            <ul className="list-disc pl-4 space-y-1">
              <li>Jangan hardcode API key — pakai environment variable (di sini disimpan di database terenkripsi).</li>
              <li>Rotasi API key berkala (mis. tiap 90 hari).</li>
              <li>Implementasikan retry dengan exponential backoff (sudah diterapkan pada status check).</li>
              <li>QRIS kedaluwarsa otomatis 15 menit setelah generate — arahkan customer membayar sebelum habis waktu.</li>
              <li>Riwayat transaksi tersimpan 90 hari di QRISLY.</li>
            </ul>
          </GuideSection>

          <p className="text-[11px] text-muted pt-1 border-t border-border">
            API key disimpan terenkripsi; nilai <code className="bg-accent px-1 rounded-sm">••••••••</code> berarti sudah terisi — biarkan kosong jika tidak ingin mengubah.
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
