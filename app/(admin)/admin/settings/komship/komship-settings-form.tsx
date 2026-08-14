"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  KOMSHIP_ENVIRONMENTS,
  KOMSHIP_PICKUP_VEHICLES,
} from "@/lib/komship-constants";
import type { KomshipDestination, KomshipService } from "@/types";

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
    brandName: FieldInit;
    shipperName: FieldInit;
    shipperPhone: FieldInit;
    shipperEmail: FieldInit;
    shipperDestinationId: FieldInit;
    shipperAddress: FieldInit;
    originPinPoint: FieldInit;
    defaultPickupVehicle: FieldInit;
    commodityCode: FieldInit;
  };
  webhookUrl: string;
  saved: {
    hasApiKey: boolean;
    hasBaseUrl: boolean;
    profileComplete: boolean;
    baseUrl: string;
    shipperDestinationId: string;
  };
}

type TestState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "ok";
      message: string;
      searchCount: number;
      reguler: KomshipService[];
      cargo: KomshipService[];
      instant: KomshipService[];
    }
  | { status: "error"; message: string };

const inputCls =
  "w-full h-9 border border-border rounded-sm px-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary bg-white";
const textareaCls =
  "w-full border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white";
const labelCls = "text-sm font-medium text-primary";

export function KomshipSettingsForm({ initial, webhookUrl, saved }: Props) {
  const [apiKey, setApiKey] = useState(initial.apiKey.value);
  const [webhookState, setWebhookState] = useState<{ status: "idle" | "loading" | "ok" | "error"; message: string }>({ status: "idle", message: "" });
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl.value || saved.baseUrl);
  const [brandName, setBrandName] = useState(initial.brandName.value);
  const [shipperName, setShipperName] = useState(initial.shipperName.value);
  const [shipperPhone, setShipperPhone] = useState(initial.shipperPhone.value);
  const [shipperEmail, setShipperEmail] = useState(initial.shipperEmail.value);
  const [shipperAddress, setShipperAddress] = useState(initial.shipperAddress.value);
  const [originPinPoint, setOriginPinPoint] = useState(initial.originPinPoint.value);
  const [defaultPickupVehicle, setDefaultPickupVehicle] = useState(
    initial.defaultPickupVehicle.value || "Motor"
  );
  const [commodityCode, setCommodityCode] = useState(initial.commodityCode.value);
  const [revealKey, setRevealKey] = useState(false);

  // Wilayah asal — search picker langsung ke API Komship
  const [destQuery, setDestQuery] = useState("");
  const [destResults, setDestResults] = useState<KomshipDestination[]>([]);
  const [destOpen, setDestOpen] = useState(false);
  const [destSearching, setDestSearching] = useState(false);
  const [destError, setDestError] = useState("");
  const [selectedDestId, setSelectedDestId] = useState("");
  const [selectedDestLabel, setSelectedDestLabel] = useState("");

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [testState, setTestState] = useState<TestState>({ status: "idle" });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // =========================================================================
  // WILAYAH ASAL — search destination Komship
  // =========================================================================

  const env = Object.values(KOMSHIP_ENVIRONMENTS).find((e) =>
    baseUrl.replace(/\/+$/, "") === e.baseUrl.replace(/\/+$/, "")
  );

  function selectEnvironment(url: string) {
    setBaseUrl(url);
  }

  async function searchDestinations(q: string) {
    if (q.trim().length < 2) {
      setDestResults([]);
      return;
    }
    setDestSearching(true);
    setDestError("");
    try {
      const res = await fetch(`/api/admin/komship/destinations?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (json.success) {
        setDestResults(json.data ?? []);
      } else {
        setDestResults([]);
        setDestError(json.code === "NOT_CONFIGURED" ? json.message : json.message ?? "Gagal mencari lokasi.");
      }
    } catch {
      setDestResults([]);
      setDestError("Gagal mencari lokasi. Coba lagi.");
    } finally {
      setDestSearching(false);
    }
  }

  function handleDestQueryChange(v: string) {
    setDestQuery(v);
    setDestOpen(true);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => searchDestinations(v), 400);
  }

  function selectDestination(d: KomshipDestination) {
    setSelectedDestId(String(d.id));
    setSelectedDestLabel(d.label);
    setDestQuery(d.label);
    setDestOpen(false);
  }

  function clearDestination() {
    setSelectedDestId("");
    setSelectedDestLabel("");
    setDestQuery("");
    setDestResults([]);
  }

  // =========================================================================
  // UJI KONEKSI — pakai nilai form saat ini (belum tentu tersimpan)
  // =========================================================================

  async function handleTest() {
    setTestState({ status: "loading" });
    try {
      const res = await fetch("/api/admin/komship/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey === initial.apiKey.value || apiKey === "••••••••" ? undefined : apiKey,
          baseUrl: baseUrl.trim() ? baseUrl : undefined,
          shipperDestinationId: selectedDestId || saved.shipperDestinationId || undefined,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const r = json.data;
        if (r.ok) {
          const calc = r.calculate ?? null;
          setTestState({
            status: "ok",
            message: r.message,
            searchCount: r.searchCount,
            reguler: calc?.reguler ?? [],
            cargo: calc?.cargo ?? [],
            instant: calc?.instant ?? [],
          });
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

  // =========================================================================
  // SIMPAN
  // =========================================================================

  async function handleSave() {
    setSaving(true);
    try {
      // Derive shared environment key — menyinkronkan Payment, QRISLY, Komship sekaligus
      const envKey = (Object.keys(KOMSHIP_ENVIRONMENTS) as Array<keyof typeof KOMSHIP_ENVIRONMENTS>).find(
        (k) => KOMSHIP_ENVIRONMENTS[k].baseUrl.replace(/\/+$/, "") === baseUrl.replace(/\/+$/, "")
      );
      const updates = [
        { key: "komship_api_key", value: apiKey },
        { key: "komship_base_url", value: baseUrl },
        { key: "komship_brand_name", value: brandName },
        { key: "komship_shipper_name", value: shipperName },
        { key: "komship_shipper_phone", value: shipperPhone },
        { key: "komship_shipper_email", value: shipperEmail },
        { key: "komship_shipper_destination_id", value: selectedDestId || undefined },
        { key: "komship_shipper_address", value: shipperAddress },
        { key: "komship_origin_pin_point", value: originPinPoint },
        { key: "komship_default_pickup_vehicle", value: defaultPickupVehicle },
        { key: "komship_commodity_code", value: commodityCode },
        ...(envKey ? [{ key: "komerce_environment", value: envKey }] : []),
      ].filter((u) => u.value !== undefined) as Array<{ key: string; value: string }>;

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

  const active = saved.hasApiKey && saved.profileComplete;

  return (
    <div className="space-y-6">
      {/* Status card */}
      <section className="bg-white rounded-sm border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-accent/40 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Status API Pengiriman</h2>
          <span
            className={`text-xs px-2 py-1 rounded-sm font-medium ${active ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}
          >
            {active ? "Aktif — siap kirim" : "Belum lengkap"}
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
          <StatusRow label="Profil Pengirim" value={saved.profileComplete ? "Lengkap" : "Belum lengkap"} ok={saved.profileComplete} />
        </div>
      </section>

      {/* ============ Environment ============ */}
      <section className="bg-white rounded-sm border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-accent/40">
          <h2 className="text-sm font-semibold">Environment</h2>
          <p className="text-xs text-muted mt-0.5">
            Sandbox untuk uji coba (tidak ada pengiriman nyata), Production untuk pengiriman sungguhan.
            API key sandbox tidak berlaku di production.{" "}
            <span className="text-primary font-medium">⚡ Mengubah environment di sini menyinkronkan Payment, QRISLY, dan Komship sekaligus.</span>
          </p>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(Object.keys(KOMSHIP_ENVIRONMENTS) as Array<keyof typeof KOMSHIP_ENVIRONMENTS>).map((key) => {
              const e = KOMSHIP_ENVIRONMENTS[key];
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
            API key dari dashboard Komerce (produk Komship). Dikirim sebagai header <code className="bg-accent px-1 rounded-sm">x-api-key</code>.
          </p>
        </div>

        <FieldBlock label="API Key" hint={initial.apiKey.hint} badge={initial.apiKey.isSecret ? "secret" : undefined}>
          <div className="relative">
            <input
              type={revealKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Masukkan API key Komship..."
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
            {testState.reguler.length + testState.cargo.length + testState.instant.length > 0 && (
              <div className="mt-2 space-y-1">
                {[
                  { title: "Reguler", list: testState.reguler },
                  { title: "Cargo", list: testState.cargo },
                  { title: "Instant", list: testState.instant },
                ]
                  .filter((g) => g.list.length > 0)
                  .map((g) => (
                    <div key={g.title}>
                      <p className="text-muted font-medium mt-1">{g.title}</p>
                      {g.list.map((s) => (
                        <p key={`${s.shippingName}-${s.serviceName}`} className="text-muted ml-2">
                          <span className="font-semibold uppercase">{s.shippingName}</span> {s.serviceName} — Rp{s.shippingCostNet.toLocaleString("id-ID")}
                          {s.etd ? ` (${s.etd})` : ""}
                        </p>
                      ))}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
        {testState.status === "error" && (
          <div className="px-6 py-3 border-t border-border bg-destructive/5 text-xs text-destructive">
            ✕ {testState.message}
          </div>
        )}

        <div className="px-6 py-3 border-t border-border">
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
          <p className="text-[11px] text-muted mt-2">
            Uji memakai nilai form saat ini: cari lokasi &amp; hitung tarif rute uji (asal → asal) bila wilayah asal sudah diisi.
          </p>
        </div>
      </section>

      {/* ============ Profil Pengirim ============ */}
      <section className="bg-white rounded-sm border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-accent/40">
          <h2 className="text-sm font-semibold">Profil Pengirim</h2>
          <p className="text-xs text-muted mt-0.5">
            Data pengirim tampil di label &amp; dipakai untuk penjemputan (pickup).
          </p>
        </div>

        <FieldBlock label="Nama Brand" hint="Nama brand yang tampil pada label pengiriman">
          <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)} className={inputCls} placeholder="HAGE CLUB" />
        </FieldBlock>

        <FieldBlock label="Nama Pengirim">
          <input type="text" value={shipperName} onChange={(e) => setShipperName(e.target.value)} className={inputCls} placeholder="Nama pengirim" />
        </FieldBlock>

        <FieldBlock label="No. HP Pengirim" hint="Harus diawali 0 atau 62 (contoh: 081234567890) — bukan +62.">
          <input type="text" value={shipperPhone} onChange={(e) => setShipperPhone(e.target.value)} className={inputCls} placeholder="081234567890" />
        </FieldBlock>

        <FieldBlock label="Email Pengirim">
          <input type="email" value={shipperEmail} onChange={(e) => setShipperEmail(e.target.value)} className={inputCls} placeholder="admin@hageclub.com" />
        </FieldBlock>

        <FieldBlock label="Alamat Pengirim">
          <textarea value={shipperAddress} onChange={(e) => setShipperAddress(e.target.value)} rows={2} className={textareaCls} placeholder="Alamat lengkap pengirim untuk penjemputan" />
        </FieldBlock>

        <FieldBlock
          label="Wilayah Asal"
          hint="Cari wilayah asal (gudang/toko) — id dipakai untuk menghitung tarif. Prioritas: kode pos / kecamatan / kota."
          badge={selectedDestLabel ? "terisi" : undefined}
        >
          <div className="relative">
            <input
              type="text"
              value={destQuery}
              onChange={(e) => handleDestQueryChange(e.target.value)}
              onFocus={() => setDestOpen(true)}
              placeholder="Cari kode pos / kecamatan / kota..."
              className={inputCls}
            />
            {selectedDestLabel && (
              <button
                type="button"
                onClick={clearDestination}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-destructive"
              >
                Hapus
              </button>
            )}
            {destOpen && destQuery.trim().length >= 2 && (
              <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto bg-white border border-border rounded-sm shadow-lg">
                {destSearching ? (
                  <p className="px-3 py-2 text-xs text-muted">Mencari...</p>
                ) : destError ? (
                  <p className="px-3 py-2 text-xs text-destructive">{destError}</p>
                ) : destResults.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-muted">Tidak ditemukan. Coba kode pos atau kecamatan.</p>
                ) : (
                  destResults.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => selectDestination(d)}
                      className="w-full text-left px-3 py-2 hover:bg-accent/60 text-xs transition-colors"
                    >
                      <p className="font-medium">{d.label}</p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          {selectedDestLabel && (
            <p className="text-[11px] text-success mt-1.5">✓ {selectedDestLabel}</p>
          )}
        </FieldBlock>

        <FieldBlock label="Pin Point Asal (opsional)" hint="Geolokasi lat,lng (contoh: -6.200000,106.816666) — wajib hanya untuk kurir instant (GoSend).">
          <input type="text" value={originPinPoint} onChange={(e) => setOriginPinPoint(e.target.value)} className={inputCls} placeholder="lat,long" />
        </FieldBlock>
      </section>

      {/* ============ Pengiriman ============ */}
      <section className="bg-white rounded-sm border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-accent/40">
          <h2 className="text-sm font-semibold">Preferensi Pengiriman</h2>
        </div>

        <FieldBlock label="Kendaraan Pickup Default" hint="Dipakai saat menjadwalkan pickup di halaman order. Motor: ≤5kg/order, Truk: ≥10kg.">
          <select
            value={defaultPickupVehicle}
            onChange={(e) => setDefaultPickupVehicle(e.target.value)}
            className="w-full h-9 border border-border rounded-sm px-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {KOMSHIP_PICKUP_VEHICLES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </FieldBlock>

        <FieldBlock label="Commodity Code (opsional)" hint="Kode klasifikasi barang — WAJIB untuk kurir LION. Contoh: ELG150. Kosongkan bila tidak pakai LION.">
          <input type="text" value={commodityCode} onChange={(e) => setCommodityCode(e.target.value)} className={inputCls} placeholder="ELG150" />
        </FieldBlock>
      </section>

      {/* ============ Webhook ============ */}
      {webhookUrl && (
        <section className="bg-white rounded-sm border border-border overflow-hidden">
          <div className="px-6 py-3 border-b border-border bg-info/5 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted mb-1">Webhook Callback URL</p>
              <p className="text-xs font-mono text-primary truncate select-all">{webhookUrl}</p>
              <p className="text-[10px] text-muted mt-0.5">
                Komerce mengirim notifikasi status pengiriman (Diajukan, Dijemput, Dikirim, Selesai,
                Dibatalkan) ke URL ini. Tombol di kanan mendaftarkan URL otomatis ke Komerce
                (PUT /webhook — dokumen section 15); bisa juga didaftarkan manual di dashboard Komerce.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <CopyButton text={webhookUrl} />
              <button
                type="button"
                onClick={async () => {
                  if (!saved.hasApiKey) {
                    setWebhookState({ status: "error", message: "Isi & simpan API key Komship terlebih dahulu, lalu coba lagi." });
                    return;
                  }
                  setWebhookState({ status: "loading", message: "" });
                  try {
                    const res = await fetch("/api/admin/komship/register-webhook", { method: "POST" });
                    const json = await res.json();
                    if (json.success) {
                      setWebhookState({ status: "ok", message: json.message ?? "Webhook berhasil didaftarkan." });
                    } else {
                      setWebhookState({ status: "error", message: json.message ?? "Gagal mendaftarkan webhook." });
                    }
                  } catch {
                    setWebhookState({ status: "error", message: "Gagal terhubung ke server." });
                  }
                }}
                disabled={webhookState.status === "loading"}
                className="flex items-center gap-1.5 h-8 px-3 bg-primary text-white text-[11px] font-medium rounded-sm hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {webhookState.status === "loading" ? (
                  <>
                    <span className="w-3 h-3 border border-white border-r-transparent rounded-full animate-spin" />
                    Mendaftarkan...
                  </>
                ) : (
                  "Daftarkan Webhook"
                )}
              </button>
            </div>
          </div>
          {webhookState.status === "ok" && (
            <p className="px-6 py-2 text-xs text-success bg-success/5 border-t border-border">✓ {webhookState.message}</p>
          )}
          {webhookState.status === "error" && (
            <p className="px-6 py-2 text-xs text-destructive bg-destructive/5 border-t border-border">✕ {webhookState.message}</p>
          )}
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
          <p className="text-xs font-semibold text-primary">Panduan Lengkap (dokumentasi resmi Komship)</p>
          <span className="text-[10px] text-muted uppercase tracking-wide">klik untuk membuka</span>
        </div>
        <div className="p-4 space-y-3">
          <div className="bg-accent/50 rounded-sm p-3 text-xs text-muted space-y-1">
            <p className="font-medium text-primary">Langkah singkat:</p>
            <p>1. Daftar/login di dashboard Komerce, aktifkan produk Komship, salin API key.</p>
            <p>2. Tempel API key di atas, pilih environment <b>Sandbox</b> dulu, tekan <b>Uji Koneksi</b>.</p>
            <p>3. Lengkapi profil pengirim &amp; wilayah asal, lalu tekan <b>Simpan Pengaturan</b>.</p>
            <p>4. Buka halaman Order → panel <b>Pengiriman</b>: Buat Pengiriman → Jadwalkan Pickup → Cetak Label → Lacak.</p>
            <p>5. Tekan <b>Daftarkan Webhook</b> (atau daftarkan URL di dashboard Komerce) agar status pengiriman otomatis tersinkron.</p>
          </div>

          <GuideSection title="Alur Kerja (sesuai dokumen)">
            <ol className="list-decimal pl-4 space-y-1">
              <li><b>Hitung tarif</b>: cari wilayah tujuan lalu tekan kalkulasi — tarif live dari semua kurir 3PL (reguler, cargo, instant).</li>
              <li><b>Store order</b>: pilih layanan &amp; tarif → buat order pengiriman di Komship (endpoint <code className="bg-accent px-1 rounded-sm">store_order</code>).</li>
              <li><b>Jadwalkan pickup</b>: minimal 90 menit dari sekarang; pilih tanggal, jam, kendaraan. Status berubah <b>Diajukan → Dijemput</b>.</li>
              <li><b>Cetak label</b>: tersedia setelah pickup sukses; format A4 (1/2/4 per halaman) atau Thermal 10×10 / 10×15.</li>
              <li><b>Lacak</b>: timeline riwayat live dari Komship; status tersinkron otomatis (<b>Dikirim → Selesai</b>).</li>
            </ol>
          </GuideSection>

          <GuideSection title="Profil Pengirim &amp; Wilayah Asal">
            <ul className="list-disc pl-4 space-y-1">
              <li><b>Brand / Pengirim</b>: nama brand, nama pengirim, telepon, email, alamat — dipakai di label paket.</li>
              <li><b>Wilayah Asal (Shipper Destination ID)</b>: wajib untuk menghitung tarif; cari via pencarian wilayah di form.</li>
              <li><b>Origin Pin Point</b>: koordinat (lat,long) alamat pengirim — dipakai kurir instant (GoSend) dan pickup.</li>
              <li><b>Kendaraan Default Pickup</b>: Motor (≤5 kg) / Mobil (5–10 kg) / Truk (≥10 kg) — bisa diganti saat jadwalkan pickup.</li>
              <li><b>Commodity Code</b>: WAJIB untuk kurir LION — isi kode komoditas (mis. 8418 untuk apparel/tekstil).</li>
            </ul>
          </GuideSection>

          <GuideSection title="Aturan Penting (dokumentasi resmi)">
            <ul className="list-disc pl-4 space-y-1">
              <li><b>Nomor telepon</b> (pengirim &amp; penerima): wajib diawali <b>0</b> atau <b>62</b>, tanpa tanda <b>+62</b>.</li>
              <li><b>Pickup</b>: minimal <b>90 menit</b> dari sekarang; <b>Motor</b> maks 5 kg/order, <b>Truk</b> wajib ≥10 kg; sandbox hanya JNE &amp; Ninja.</li>
              <li><b>Pembatalan order</b>: hanya untuk status <b>Created</b>/<b>Packing</b> (belum dijemput kurir); refund saldo otomatis untuk pembayaran transfer.</li>
              <li><b>Label</b>: tersedia setelah pickup sukses; pilih format A4 (1/2/4 per halaman) atau Thermal 10×10 / 10×15.</li>
              <li><b>GoSend</b>: tarif dinamis (surge pricing) — harga berlaku saat request, bisa berubah dalam hitungan menit.</li>
              <li><b>COD</b>: tidak tersedia di toko ini — semua pengiriman memakai pembayaran transfer (biaya layanan Rp0).</li>
            </ul>
          </GuideSection>

          <GuideSection title="Biaya &amp; Asuransi (pricing resmi)">
            <p><b>Ongkir</b>: tarif per layanan kurir dihitung dari berat, rute, dan nilai barang — selalu cek via kalkulasi sebelum buat order.</p>
            <p className="mt-1"><b>Asuransi</b> (per kurir, dihitung dari total harga produk):</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>JNE: (0,2% × total) + <b>Rp5.000</b> admin tetap.</li>
              <li>SiCepat: 0,3% × grand total — <b>hanya jika grand total &gt; Rp500.000</b>.</li>
              <li>IDExpress: 0,2% × total (tanpa biaya admin).</li>
              <li>SAP: (0,3% × total) + Rp2.000 per AWB.</li>
              <li>Ninja: total ≤ Rp1.000.000 → flat Rp2.500; &gt; Rp1.000.000 → 0,25% × total.</li>
              <li>J&amp;T: 0,2% × total · Lion: 0,3% × total (tanpa admin).</li>
            </ul>
            <p className="mt-1 text-muted">Sandbox: tarif semua kurir flat Rp8.000 (tidak mengikuti rumus asli).</p>
          </GuideSection>

          <GuideSection title="Webhook (sinkronisasi status)">
            <p>Status pengiriman tersinkron otomatis ke halaman Order via webhook. URL handler:</p>
            <p className="bg-accent/50 rounded-sm px-2 py-1.5 font-mono text-[11px] break-all">{webhookUrl || "URL webhook muncul setelah App URL terisi"}</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Daftarkan lewat tombol <b>Daftarkan Webhook</b> di atas (wajib HTTPS — di dev http ditolak), atau manual: PUT ke <code className="bg-accent px-1 rounded-sm">&#123;base_url&#125;/webhook</code> dengan body <code className="bg-accent px-1 rounded-sm">&#123;webhook_url&#125;</code>.</li>
              <li>Payload event: <code className="bg-accent px-1 rounded-sm">order_no</code> (no. order), <code className="bg-accent px-1 rounded-sm">cnote</code> (no. AWB), <code className="bg-accent px-1 rounded-sm">status</code>.</li>
              <li>Status: <b>Diajukan · Dijemput · Dikirim · Dibatalkan · Selesai</b>.</li>
              <li>Wajib balas <b>HTTP 200</b> — jika gagal, Komerce akan retry atau menonaktifkan webhook.</li>
            </ul>
          </GuideSection>

          <GuideSection title="Dukungan Kurir 3PL &amp; Diskon (dokumen resmi)">
            <ul className="list-disc pl-4 space-y-1">
              <li>JNE, SAP (diskon 30%), IDExpress, SiCepat, J&amp;T, Ninja (diskon 40%), Lion — reguler &amp; cargo (Lion tanpa COD).</li>
              <li>GoSend (instant) — tanpa COD, tarif dinamis.</li>
              <li>Kurir LION mewajibkan <b>Commodity Code</b> — isi di Preferensi Pengiriman di atas.</li>
            </ul>
          </GuideSection>

          <p className="pt-2 border-t border-border text-xs text-muted">
            Catatan: saat produksi, ganti environment &amp; API key — jangan pakai API key sandbox di production (kunci sandbox
            tidak berlaku di prod).
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
