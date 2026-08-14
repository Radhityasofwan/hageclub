"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  V2_COURIERS,
  COURIER_LABELS,
  DEFAULT_BASE_URL,
} from "@/lib/rajaongkir-constants";
import type { RajaOngkirCourierTest } from "@/lib/rajaongkir";
import type { V2Province, V2City, V2District, V2SubDistrict } from "@/types";

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
    originCityId: FieldInit;
    originLabel: FieldInit;
    couriers: FieldInit;
    webhookSecret: FieldInit;
  };
  webhookUrl: string;
  saved: {
    hasApiKey: boolean;
    baseUrl: string;
    originCityId: string;
    originLabel: string;
    couriers: string[];
  };
}

type TestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; message: string; courierResults: RajaOngkirCourierTest[] }
  | { status: "error"; message: string };

const inputCls =
  "w-full h-9 border border-border rounded-sm px-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary bg-white";
const labelCls = "text-sm font-medium text-primary";

export function RajaOngkirSettingsForm({ initial, webhookUrl, saved }: Props) {
  const [apiKey, setApiKey] = useState(initial.apiKey.value);
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl.value || saved.baseUrl);
  const [webhookSecret, setWebhookSecret] = useState(initial.webhookSecret.value);
  const [revealKey, setRevealKey] = useState(false);
  const [revealSecret, setRevealSecret] = useState(false);
  const [couriers, setCouriers] = useState<string[]>(saved.couriers);

  // Origin picker — step-by-step (province → city → district → sub-district)
  const [provinces, setProvinces] = useState<V2Province[]>([]);
  const [cities, setCities] = useState<V2City[]>([]);
  const [districts, setDistricts] = useState<V2District[]>([]);
  const [subDistricts, setSubDistricts] = useState<V2SubDistrict[]>([]);
  const [provinceId, setProvinceId] = useState("");
  const [cityId, setCityId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [subDistrictId, setSubDistrictId] = useState("");
  const [chainError, setChainError] = useState("");
  const [loadingLevel, setLoadingLevel] = useState("");

  // Nilai asal yang akan disimpan: pilihan baru dari chain, atau yang tersimpan
  const [pendingOriginId, setPendingOriginId] = useState("");
  const [pendingOriginLabel, setPendingOriginLabel] = useState("");

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
    };
  }, []);

  // =========================================================================
  // ORIGIN PICKER (metode step-by-step)
  // =========================================================================

  async function fetchLocations<T>(url: string): Promise<T[] | null> {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setChainError(json?.code === "NOT_CONFIGURED" ? json.message : "Gagal memuat data lokasi.");
        return null;
      }
      const json = await res.json();
      setChainError("");
      return json.data ?? [];
    } catch {
      setChainError("Gagal memuat data lokasi. Coba lagi.");
      return null;
    }
  }

  function resetFrom(level: "province" | "city" | "district") {
    if (level === "province") {
      setCityId(""); setDistrictId(""); setSubDistrictId("");
      setCities([]); setDistricts([]); setSubDistricts([]);
    } else if (level === "city") {
      setDistrictId(""); setSubDistrictId("");
      setDistricts([]); setSubDistricts([]);
    } else {
      setSubDistrictId("");
      setSubDistricts([]);
    }
    setPendingOriginId("");
    setPendingOriginLabel("");
  }

  async function handleProvinceChange(id: string) {
    setProvinceId(id);
    resetFrom("province");
    if (!id) return;
    setLoadingLevel("city");
    const list = await fetchLocations<V2City>(`/api/shipping/cities?province=${id}`);
    if (list) setCities(list);
    setLoadingLevel("");
  }

  async function handleCityChange(id: string) {
    setCityId(id);
    resetFrom("city");
    if (!id) return;
    setLoadingLevel("district");
    const list = await fetchLocations<V2District>(`/api/shipping/districts?city=${id}`);
    if (list) setDistricts(list);
    setLoadingLevel("");
  }

  async function handleDistrictChange(id: string) {
    setDistrictId(id);
    resetFrom("district");
    if (!id) return;
    setLoadingLevel("sub");
    const list = await fetchLocations<V2SubDistrict>(`/api/shipping/sub-districts?district=${id}`);
    if (list) setSubDistricts(list);
    setLoadingLevel("");
  }

  function handleSubDistrictChange(id: string) {
    setSubDistrictId(id);
    if (!id) {
      setPendingOriginId("");
      setPendingOriginLabel("");
      return;
    }
    const sub = subDistricts.find((s) => String(s.id) === id);
    const district = districts.find((d) => String(d.id) === districtId);
    const city = cities.find((c) => String(c.id) === cityId);
    const province = provinces.find((p) => String(p.id) === provinceId);
    setPendingOriginId(id);
    setPendingOriginLabel(
      [sub?.name, district?.name, city?.name, province?.name]
        .filter(Boolean)
        .join(", ")
    );
  }

  useEffect(() => {
    fetchLocations<V2Province>("/api/shipping/provinces").then((list) => {
      if (list) setProvinces(list);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================================================================
  // TEST KONEKSI — pakai nilai form saat ini (key/base URL belum tentu disimpan)
  // =========================================================================

  async function handleTest() {
    setTestState({ status: "loading" });
    try {
      const res = await fetch("/api/admin/rajaongkir/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey === initial.apiKey.value || apiKey === "••••••••" ? undefined : apiKey,
          baseUrl: baseUrl.trim() ? baseUrl : undefined,
          originCityId: pendingOriginId || saved.originCityId || undefined,
          couriers,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const r = json.data;
        setTestState(
          r.ok
            ? {
                status: "ok",
                message: r.message,
                courierResults: r.courierResults ?? [],
              }
            : { status: "error", message: r.message }
        );
      } else {
        setTestState({ status: "error", message: json.message ?? "Uji koneksi gagal." });
      }
    } catch {
      setTestState({ status: "error", message: "Gagal terhubung ke server." });
    }
  }

  // =========================================================================
  // SIMPAN
  // =========================================================================

  async function handleSave() {
    if (couriers.length === 0) {
      showToast("error", "Pilih minimal satu kurir aktif.");
      return;
    }

    setSaving(true);
    try {
      const originId = pendingOriginId || saved.originCityId;
      const originLabel = pendingOriginLabel || saved.originLabel;

      const updates: Array<{ key: string; value: string }> = [
        { key: "rajaongkir_api_key", value: apiKey },
        { key: "rajaongkir_base_url", value: baseUrl.trim() || DEFAULT_BASE_URL },
        { key: "rajaongkir_origin_city_id", value: originId },
        { key: "rajaongkir_origin_label", value: originLabel },
        { key: "rajaongkir_couriers", value: couriers.join(",") },
        { key: "rajaongkir_webhook_secret", value: webhookSecret },
      ];

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Gagal menyimpan");
      showToast("success", "Pengaturan RajaOngkir tersimpan.");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  const keyMasked = initial.apiKey.isSecret && apiKey === "••••••••";

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-sm text-sm font-medium shadow-lg transition-all ${toast.type === "success" ? "bg-success text-white" : "bg-destructive text-white"}`}>
          {toast.type === "success" ? "✓" : "✕"} {toast.message}
        </div>
      )}

      {/* ============ Status ============ */}
      <section className="bg-white rounded-sm border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-accent/40 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Status Integrasi</h2>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-sm tracking-wide uppercase ${saved.hasApiKey && saved.originCityId ? "bg-success/10 text-success border border-success/30" : "bg-warning/10 text-warning border border-warning/30"}`}>
                {saved.hasApiKey && saved.originCityId ? "Aktif" : "Belum lengkap"}
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5">Ringkasan konfigurasi yang tersimpan</p>
          </div>
        </div>
        <div className="divide-y divide-border text-sm">
          <StatusRow label="API Key" value={saved.hasApiKey ? "Terpasang" : "Belum diisi"} ok={saved.hasApiKey} />
          <StatusRow label="Base URL" value={saved.baseUrl} ok={Boolean(saved.baseUrl)} mono />
          <StatusRow label="Wilayah Asal" value={saved.originLabel || "Belum diatur"} ok={Boolean(saved.originLabel)} />
          <StatusRow label="Kurir Aktif" value={saved.couriers.map((c) => COURIER_LABELS[c] ?? c).join(", ") || "Belum ada"} ok={saved.couriers.length > 0} />
        </div>
      </section>

      {/* ============ Kredensial ============ */}
      <section className="bg-white rounded-sm border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-accent/40 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Kredensial API</h2>
            <p className="text-xs text-muted mt-0.5">
              API key dari dashboard rajaongkir.com (produk Shipping Cost / Cek Ongkir)
            </p>
          </div>
          <button
            type="button"
            onClick={handleTest}
            disabled={testState.status === "loading"}
            className="flex items-center gap-2 h-8 px-4 border border-border rounded-sm text-xs font-medium text-primary hover:border-primary transition-colors disabled:opacity-60"
          >
            {testState.status === "loading" ? (
              <>
                <span className="w-3 h-3 border border-primary border-r-transparent rounded-full animate-spin" />
                Menguji...
              </>
            ) : (
              "Uji Koneksi"
            )}
          </button>
        </div>

        <div className="divide-y divide-border">
          <FieldBlock
            label="API Key"
            hint="Kunci API dari dashboard RajaOngkir. Disimpan terenkripsi dan tidak pernah ditampilkan kembali."
            badge="Secret"
          >
            <div className="relative">
              <input
                type={revealKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={keyMasked ? "Biarkan kosong untuk tidak mengubah" : "Masukkan API key..."}
                autoComplete="off"
                spellCheck={false}
                className={inputCls + " pr-10"}
              />
              <button type="button" onClick={() => setRevealKey((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary" aria-label={revealKey ? "Sembunyikan" : "Tampilkan"}>
                {revealKey ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
          </FieldBlock>

          <FieldBlock
            label="Base URL"
            hint="Endpoint API RajaOngkir V2. Default: https://rajaongkir.komerce.id/api/v1 — tidak perlu diubah kecuali ada instruksi resmi."
          >
            <input type="text" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} spellCheck={false} className={inputCls} />
          </FieldBlock>

          <FieldBlock
            label="Webhook Secret"
            hint="Opsional — untuk produk Shipping Delivery / Payment (verifikasi notifikasi otomatis)."
            badge="Secret"
          >
            <div className="relative">
              <input
                type={revealSecret ? "text" : "password"}
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder={initial.webhookSecret.hasValue ? "Biarkan kosong untuk tidak mengubah" : "Masukkan webhook secret..."}
                autoComplete="off"
                spellCheck={false}
                className={inputCls + " pr-10"}
              />
              <button type="button" onClick={() => setRevealSecret((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary" aria-label={revealSecret ? "Sembunyikan" : "Tampilkan"}>
                {revealSecret ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
          </FieldBlock>
        </div>

        {/* Hasil uji koneksi */}
        {testState.status === "ok" && (
          <div className="px-6 py-3 border-t border-border bg-success/5 text-xs">
            <p className="font-medium text-success">✓ {testState.message}</p>
            {testState.courierResults.length > 0 && (
              <ul className="mt-2 space-y-1">
                {testState.courierResults.map((r) => (
                  <li key={r.courier} className="flex items-start gap-2">
                    <span
                      className={
                        "font-semibold uppercase shrink-0 w-32 " +
                        (r.ok ? "text-success" : "text-destructive")
                      }
                    >
                      {COURIER_LABELS[r.courier] ?? r.courier}
                    </span>
                    {r.ok ? (
                      <span className="text-muted">
                        {r.service} — Rp{r.cost?.toLocaleString("id-ID")} ({r.etd} hari)
                      </span>
                    ) : (
                      <span className="text-destructive">{r.error}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {testState.status === "error" && (
          <div className="px-6 py-3 border-t border-border bg-destructive/5 text-xs text-destructive">
            ✕ {testState.message}
          </div>
        )}
      </section>

      {/* ============ Wilayah Asal (step-by-step) ============ */}
      <section className="bg-white rounded-sm border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-accent/40">
          <h2 className="text-sm font-semibold">Wilayah Asal Pengiriman</h2>
          <p className="text-xs text-muted mt-0.5">
            Lokasi gudang/toko — pilih sampai tingkat kelurahan agar tarif akurat.
            Metode hierarki: Provinsi → Kota/Kab → Kecamatan → Kelurahan/Desa.
          </p>
        </div>

        <div className="px-6 py-4 space-y-4">
          {saved.originLabel && !pendingOriginLabel && (
            <div className="flex items-center justify-between bg-accent/60 rounded-sm px-3 py-2 text-xs">
              <span className="text-muted">
                Tersimpan: <span className="font-medium text-primary">{saved.originLabel}</span>{" "}
                <span className="text-muted/70">(tetap dipakai jika tidak memilih ulang)</span>
              </span>
            </div>
          )}

          {pendingOriginLabel && (
            <div className="bg-success/10 border border-success/30 rounded-sm px-3 py-2 text-xs text-success">
              ✓ Pilihan baru: {pendingOriginLabel}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label="Provinsi"
              value={provinceId}
              onChange={handleProvinceChange}
              options={provinces.map((p) => ({ value: String(p.id), label: p.name }))}
              loading={false}
              placeholder="Pilih provinsi..."
            />
            <SelectField
              label="Kota / Kabupaten"
              value={cityId}
              onChange={handleCityChange}
              options={cities.map((c) => ({ value: String(c.id), label: c.name }))}
              loading={loadingLevel === "city"}
              placeholder={provinceId ? "Pilih kota..." : "Pilih provinsi dulu"}
              disabled={!provinceId}
            />
            <SelectField
              label="Kecamatan"
              value={districtId}
              onChange={handleDistrictChange}
              options={districts.map((d) => ({ value: String(d.id), label: d.name }))}
              loading={loadingLevel === "district"}
              placeholder={cityId ? "Pilih kecamatan..." : "Pilih kota dulu"}
              disabled={!cityId}
            />
            <SelectField
              label="Kelurahan / Desa"
              value={subDistrictId}
              onChange={handleSubDistrictChange}
              options={subDistricts.map((s) => ({ value: String(s.id), label: s.name }))}
              loading={loadingLevel === "sub"}
              placeholder={districtId ? "Pilih kelurahan..." : "Pilih kecamatan dulu"}
              disabled={!districtId}
            />
          </div>

          {chainError && <p className="text-xs text-destructive">{chainError}</p>}
          <p className="text-[11px] text-muted">
            Data lokasi dimuat dari API RajaOngkir (di-cache 24 jam). Jika list tidak muncul, pastikan API key sudah diisi lalu tekan Simpan.
          </p>
        </div>
      </section>

      {/* ============ Kurir ============ */}
      <section className="bg-white rounded-sm border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-accent/40">
          <h2 className="text-sm font-semibold">Kurir Aktif</h2>
          <p className="text-xs text-muted mt-0.5">
            Kurir yang ditawarkan di checkout &amp; estimator. Semakin banyak kurir, semakin lama hitung ongkir.
          </p>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {V2_COURIERS.map((code) => {
              const active = couriers.includes(code);
              return (
                <label
                  key={code}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-sm text-sm cursor-pointer transition-colors ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() =>
                      setCouriers((prev) =>
                        active ? prev.filter((c) => c !== code) : [...prev, code]
                      )
                    }
                    className="accent-primary"
                  />
                  <span className="truncate">{COURIER_LABELS[code]}</span>
                  <code className="text-[10px] text-muted ml-auto shrink-0">{code}</code>
                </label>
              );
            })}
          </div>
          <p className="text-[11px] text-muted mt-3">
            Kode kurir sesuai dokumentasi V2 (rajaongkir.komerce.id/api/v1). API menolak kode yang tidak valid — pastikan memakai kode dari daftar ini.
          </p>
        </div>
      </section>

      {/* ============ Webhook ============ */}
      {webhookUrl && (
        <section className="bg-white rounded-sm border border-border overflow-hidden">
          <div className="px-6 py-3 border-b border-border bg-info/5 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted mb-1">Webhook Callback URL</p>
              <p className="text-xs font-mono text-primary truncate select-all">{webhookUrl}</p>
              <p className="text-[10px] text-muted mt-0.5">
                Daftarkan URL ini di dashboard RajaOngkir untuk produk Shipping Delivery / Payment (bukan shipping cost).
              </p>
            </div>
            <CopyButton text={webhookUrl} />
          </div>
        </section>
      )}

      {/* ============ Simpan ============ */}
      <div className="flex items-center justify-between bg-accent/40 border border-border rounded-sm px-4 py-3">
        <p className="text-xs text-muted">
          Perubahan langsung aktif setelah disimpan (tidak perlu restart server).
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

      {/* ============ Panduan ============ */}
      <section className="rounded-sm border border-border bg-white">
        <div className="px-4 py-3 border-b border-border bg-accent/40 flex items-center justify-between">
          <p className="text-xs font-semibold text-primary">Panduan Lengkap (dokumentasi resmi RajaOngkir)</p>
          <span className="text-[10px] text-muted uppercase tracking-wide">klik untuk membuka</span>
        </div>
        <div className="p-4 space-y-3">
          <div className="bg-accent/50 rounded-sm p-3 text-xs text-muted space-y-1">
            <p className="font-medium text-primary">Langkah singkat:</p>
            <p>1. Daftar/login di rajaongkir.com, buka menu API → buat API key untuk produk Shipping Cost (Cek Ongkir).</p>
            <p>2. Tempel API key di atas, lalu tekan <b>Uji Koneksi</b> — pastikan hasilnya &quot;Koneksi berhasil&quot;.</p>
            <p>3. Pilih wilayah asal pengiriman (gudang/toko) sampai tingkat kelurahan, lalu pilih kurir aktif.</p>
            <p>4. Tekan <b>Simpan Pengaturan</b>. Ongkir langsung aktif di halaman checkout &amp; estimasi produk.</p>
          </div>

          <GuideSection title="Cara Mendapatkan API Key">
            <p>1. Buka <b>rajaongkir.com</b> dan login ke akun Anda.</p>
            <p>2. Pilih produk <b>Shipping Cost (Cek Ongkir)</b> — produk ini yang dipakai untuk hitung ongkir domestik &amp; internasional.</p>
            <p>3. Generate <b>API key</b> dari menu API dashboard, lalu salin nilainya.</p>
            <p>4. Tempel di kolom <b>API Key</b> halaman ini, tekan <b>Uji Koneksi</b>, lalu <b>Simpan Pengaturan</b>.</p>
            <p className="text-warning">Catatan: satu API key berlaku untuk satu produk. Key produk lain (Shipping Delivery/Payment) tidak bisa dipakai di sini.</p>
          </GuideSection>

          <GuideSection title="Metode 1 — Hierarki Lokasi Step-by-Step">
            <p>Lokasi dipilih berjenjang (paling detail = tarif paling akurat). Endpoint resmi:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li><code className="bg-accent px-1 rounded-sm">GET /destination/province</code> — daftar provinsi</li>
              <li><code className="bg-accent px-1 rounded-sm">GET /destination/city/&#123;province_id&#125;</code> — kota/kab per provinsi</li>
              <li><code className="bg-accent px-1 rounded-sm">GET /destination/district/&#123;city_id&#125;</code> — kecamatan per kota</li>
              <li><code className="bg-accent px-1 rounded-sm">GET /destination/sub-district/&#123;district_id&#125;</code> — kelurahan/desa per kecamatan</li>
              <li><code className="bg-accent px-1 rounded-sm">POST /calculate/district/domestic-cost</code> — hitung ongkir antar kecamatan (origin, destination, weight, courier)</li>
            </ul>
            <p>Pilih lokasi sampai <b>kelurahan/desa</b> agar ongkir sesuai tarif resmi per wilayah.</p>
          </GuideSection>

          <GuideSection title="Metode 2 — Pencarian Langsung (Autocomplete)">
            <p>Pencarian satu langkah tanpa berjenjang — dipakai di form alamat checkout:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li><code className="bg-accent px-1 rounded-sm">GET /destination/domestic-destination?search=&#123;kata kunci&#125;&amp;limit=&amp;offset=</code> — hasil: id, label, provinsi, kota, kecamatan, kelurahan, kode pos</li>
              <li><code className="bg-accent px-1 rounded-sm">POST /calculate/domestic-cost</code> — hitung ongkir dengan id hasil pencarian</li>
            </ul>
            <p>Kata kunci bisa nama kota, kecamatan, desa, atau kode pos. <b>id</b> dari hasil inilah yang dipakai sebagai parameter ongkir.</p>
          </GuideSection>

          <GuideSection title="Parameter Hitung Ongkir">
            <div className="space-y-1.5">
              <p><b>origin</b> (wajib) — id lokasi asal dari pencarian destinasi.</p>
              <p><b>destination</b> (wajib) — id lokasi tujuan dari pencarian destinasi.</p>
              <p><b>weight</b> (wajib) — berat paket dalam <b>gram</b>. Contoh: 1 kg = 1000. Jangan pakai 0 atau negatif.</p>
              <p><b>courier</b> (wajib) — kode kurir valid, mis. jne, jnt, sicepat. Kode salah → error 422.</p>
              <p><b>price</b> — urutan harga: <b>lowest</b> (termurah) atau <b>highest</b> (termahal).</p>
              <p className="text-muted">Semua request wajib menyertakan header <code className="bg-accent px-1 rounded-sm">key: API_KEY</code>.</p>
            </div>
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
                    <td className="px-2 py-1.5 border border-border">Rute/kurir tidak mendukung atau parameter salah</td>
                    <td className="px-2 py-1.5 border border-border">Cek kembali id lokasi &amp; parameter; wajar bila kurir tidak melayani rute tertentu</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1.5 border border-border font-mono">404</td>
                    <td className="px-2 py-1.5 border border-border">Destinasi tidak ditemukan</td>
                    <td className="px-2 py-1.5 border border-border">Pastikan nama kota/kecamatan/desa atau kode pos benar</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1.5 border border-border font-mono">422</td>
                    <td className="px-2 py-1.5 border border-border">Parameter hilang / kode kurir tidak valid</td>
                    <td className="px-2 py-1.5 border border-border">Lengkapi parameter wajib; pakai kode kurir dari daftar di bagian Kurir Aktif</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1.5 border border-border font-mono">500</td>
                    <td className="px-2 py-1.5 border border-border">Server error</td>
                    <td className="px-2 py-1.5 border border-border">Coba lagi beberapa saat; hubungi support bila berulang</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </GuideSection>

          <GuideSection title="Tips Resmi Menghindari Error">
            <ul className="list-disc pl-4 space-y-1">
              <li>Selalu validasi input — jangan kirim string kosong, angka, atau simbol saja.</li>
              <li>Gunakan <b>debounce</b> pada pencarian as-you-type (sudah diterapkan di form ini &amp; checkout).</li>
              <li>Cache hasil pencarian populer (sudah diterapkan: lokasi 24 jam, pencarian 10 menit).</li>
              <li>Berat paket dalam gram; 1 kg = 1000 g; hindari 0 atau negatif.</li>
              <li>Jika tidak ada service yang kembali, beri tahu pengguna bahwa rute/kurir mungkin tidak didukung.</li>
              <li>Sertakan header <code className="bg-accent px-1 rounded-sm">key</code> pada setiap request.</li>
            </ul>
          </GuideSection>

          <p className="text-[11px] text-muted pt-1 border-t border-border">
            API key &amp; webhook secret disimpan terenkripsi; nilai <code className="bg-accent px-1 rounded-sm">••••••••</code> berarti sudah terisi — biarkan kosong jika tidak ingin mengubah.
          </p>
        </div>
      </section>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

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
      <label className={labelCls}>
        {label}
        {badge && (
          <span className="ml-2 text-[10px] text-muted border border-border rounded-sm px-1 py-0.5 uppercase tracking-wide">{badge}</span>
        )}
      </label>
      {hint && <p className="text-xs text-muted mt-0.5 mb-2">{hint}</p>}
      {!hint && <div className="mt-2" />}
      {children}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  loading,
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  loading: boolean;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        className="w-full h-9 border border-border rounded-sm px-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <option value="">{loading ? "Memuat..." : placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
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

function IconEyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 2l12 12M6.5 6.6A2 2 0 0010 9.5M4.6 4.7C2.8 5.9 1 8 1 8s2.5 5 7 5c1.3 0 2.5-.3 3.5-.9M10 3.4C9.4 3.2 8.7 3 8 3 3.5 3 1 8 1 8s.5 1 1.5 2" strokeLinecap="round" />
    </svg>
  );
}
