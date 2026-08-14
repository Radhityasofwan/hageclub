"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatPrice } from "@/lib/utils";
import { KOMSHIP_LABEL_PAGES, KOMSHIP_PICKUP_VEHICLES } from "@/lib/komship-constants";
import type {
  KomshipDestination,
  KomshipService,
  KomshipCalculateResult,
  KomshipHistoryEntry,
  KomshipOrderDetail,
} from "@/types";

export interface DeliveryOrderInfo {
  id: string;
  orderNumber: string;
  status: string;
  deliveryOrderNo: string | null;
  deliveryStatus: string | null;
  deliveryLabelPath: string | null;
  trackingNumber: string | null;
}

interface Props {
  order: DeliveryOrderInfo;
  onChange: () => void;
}

interface PrepareData {
  order: {
    orderNumber: string;
    status: string;
    courier: string | null;
    courierService: string | null;
    subtotal: number;
    shippingCost: number;
    total: number;
    note: string | null;
  };
  receiver: {
    name: string;
    phone: string;
    street: string;
    district: string;
    city: string;
    province: string;
    postalCode: string;
    locationLabel: string | null;
  };
  weightKg: number;
  itemValue: number;
  preferredCourier: string | null;
  candidates: KomshipDestination[];
  destinationId: number | null;
  destinationLabel: string;
  calculate: KomshipCalculateResult | null;
  shipperReady: boolean;
}

const DELIVERY_STATUS_VARIANTS: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  Diajukan: "info",
  Dijemput: "warning",
  Dikirim: "info",
  Selesai: "success",
  Dibatalkan: "danger",
};

const inputCls =
  "w-full h-9 border border-border rounded-sm px-3 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary";

export function DeliveryPanel({ order, onChange }: Props) {
  const [preparing, setPreparing] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const [prepareError, setPrepareError] = useState("");
  const [data, setData] = useState<PrepareData | null>(null);

  // Modal state
  const [modal, setModal] = useState<null | "create" | "pickup" | "label" | "track" | "detail" | "cancel">(null);

  const loadPrepare = useCallback(async () => {
    setPreparing(true);
    setPrepareError("");
    try {
      const res = await fetch("/api/admin/delivery/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const json = await res.json();
      if (json.success) {
        if (json.data.configured) {
          setData(json.data);
          setModal("create");
        } else {
          setNotConfigured(true);
        }
      } else {
        if (res.status === 409) {
          setPrepareError(json.message);
        } else {
          setPrepareError(json.message ?? "Gagal menyiapkan pengiriman.");
        }
      }
    } catch {
      setPrepareError("Gagal menyiapkan pengiriman.");
    } finally {
      setPreparing(false);
    }
  }, [order.id]);

  const stored = Boolean(order.deliveryOrderNo);

  return (
    <div className="bg-white border border-border rounded">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold">Pengiriman (Komship)</h3>
        {stored && order.deliveryStatus && (
          <Badge variant={DELIVERY_STATUS_VARIANTS[order.deliveryStatus] ?? "default"} size="sm">
            {order.deliveryStatus}
          </Badge>
        )}
      </div>

      <div className="px-5 py-4 space-y-4">
        {stored ? (
          <>
            {/* Ringkasan pengiriman */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">No. Order Komship</span>
                <span className="font-mono font-medium">{order.deliveryOrderNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Nomor Resi (AWB)</span>
                <span className="font-mono font-medium">{order.trackingNumber ?? "Belum ada"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Status</span>
                <span className="font-medium">{order.deliveryStatus ?? "—"}</span>
              </div>
              {order.deliveryLabelPath && (
                <div className="flex justify-between">
                  <span className="text-muted">Label</span>
                  <span className="font-mono text-muted truncate ml-4">sudah dibuat</span>
                </div>
              )}
            </div>

            {/* Aksi */}
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" size="sm" onClick={() => setModal("pickup")}>
                Jadwalkan Pickup
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setModal("label")}>
                Cetak Label
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setModal("track")}
                disabled={!order.trackingNumber}
              >
                Lacak
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setModal("detail")}>
                Detail
              </Button>
              <Button variant="danger" size="sm" onClick={() => setModal("cancel")}>
                Batalkan
              </Button>
            </div>
          </>
        ) : (
          <>
            {notConfigured ? (
              <div className="text-xs text-muted space-y-3">
                <p>
                  API Komship belum dikonfigurasi. Isi API key &amp; profil pengirim di{" "}
                  <a href="/admin/settings/komship" className="text-primary hover:underline">
                    Settings → Pengiriman
                  </a>{" "}
                  terlebih dahulu.
                </p>
                <Button variant="secondary" size="sm" onClick={loadPrepare} disabled={preparing}>
                  {preparing ? "Memuat..." : "Periksa Lagi"}
                </Button>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted">
                  Buat order pengiriman di Komship: hitung tarif live, pilih layanan kurir, lalu
                  jadwalkan pickup &amp; cetak label.
                </p>
                {prepareError && <p className="text-xs text-destructive">{prepareError}</p>}
                <Button variant="primary" size="sm" onClick={loadPrepare} loading={preparing}>
                  Buat Pengiriman
                </Button>
              </>
            )}
          </>
        )}
      </div>

      {modal === "create" && data && (
        <CreateDeliveryModal
          order={order}
          data={data}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            onChange();
          }}
        />
      )}
      {modal === "pickup" && (
        <PickupModal
          orderId={order.id}
          orderNumber={order.orderNumber}
          weightKg={data?.weightKg ?? 0}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            onChange();
          }}
        />
      )}
      {modal === "label" && (
        <LabelModal
          order={order}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            onChange();
          }}
        />
      )}
      {modal === "track" && <TrackModal order={order} onClose={() => setModal(null)} />}
      {modal === "detail" && <DetailModal order={order} onClose={() => setModal(null)} />}
      {modal === "cancel" && (
        <CancelDeliveryModal
          order={order}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            onChange();
          }}
        />
      )}
    </div>
  );
}

// =============================================================================
// MODAL BATALKAN PENGIRIMAN
// =============================================================================

function CancelDeliveryModal({
  order,
  onClose,
  onDone,
}: {
  order: DeliveryOrderInfo;
  onClose: () => void;
  onDone: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleCancel() {
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/delivery/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const json = await res.json();
      if (json.success) {
        onDone();
      } else {
        setErrorMsg(json.message ?? "Gagal membatalkan pengiriman.");
      }
    } catch {
      setErrorMsg("Gagal membatalkan pengiriman.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Batalkan Pengiriman" size="sm">
      <div className="space-y-4 text-sm">
        <p className="text-xs text-muted">
          Batalkan order pengiriman <strong className="font-mono">{order.deliveryOrderNo}</strong> di Komship?
          Aksi ini mengirim permintaan pembatalan ke Komship dan menandai status sebagai Dibatalkan.
        </p>
        {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" onClick={onClose}>Tidak</Button>
          <Button variant="danger" loading={submitting} onClick={handleCancel}>
            Ya, Batalkan
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Badge({
  variant = "default",
  size = "sm",
  children,
}: {
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
  children: React.ReactNode;
}) {
  const v: Record<string, string> = {
    default: "bg-accent text-muted",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-destructive/10 text-destructive",
    info: "bg-info/10 text-info",
  };
  return (
    <span className={`inline-flex items-center rounded-sm font-medium ${size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1"} ${v[variant]}`}>
      {children}
    </span>
  );
}

// =============================================================================
// MODAL BUAT PENGIRIMAN — pilih tujuan, hitung tarif, pilih layanan, store order
// =============================================================================

function CreateDeliveryModal({
  order,
  data,
  onClose,
  onDone,
}: {
  order: DeliveryOrderInfo;
  data: PrepareData;
  onClose: () => void;
  onDone: () => void;
}) {
  const [destResults, setDestResults] = useState<KomshipDestination[]>(data.candidates);
  const [destQuery, setDestQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(data.destinationId);
  const [selectedLabel, setSelectedLabel] = useState(data.destinationLabel);
  const [calculate, setCalculate] = useState<KomshipCalculateResult | null>(data.calculate);
  const [calcLoading, setCalcLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<KomshipService | null>(null);
  const [storing, setStoring] = useState(false);
  const [storeError, setStoreError] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  async function search(q: string) {
    if (q.trim().length < 2) return;
    setSearching(true);
    setSearchError("");
    try {
      const res = await fetch(`/api/admin/komship/destinations?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (json.success) {
        setDestResults(json.data ?? []);
      } else {
        setSearchError(json.message ?? "Gagal mencari lokasi.");
      }
    } catch {
      setSearchError("Gagal mencari lokasi.");
    } finally {
      setSearching(false);
    }
  }

  function handleQueryChange(v: string) {
    setDestQuery(v);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => search(v), 400);
  }

  async function selectDestination(d: KomshipDestination) {
    setSelectedId(d.id);
    setSelectedLabel(d.label);
    setSelectedService(null);
    setCalcLoading(true);
    setStoreError("");
    try {
      const res = await fetch("/api/admin/delivery/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, destinationId: d.id }),
      });
      const json = await res.json();
      if (json.success) {
        setCalculate(json.data.calculate);
      } else {
        setCalculate(null);
        setStoreError(json.message ?? "Gagal menghitung tarif.");
      }
    } catch {
      setCalculate(null);
      setStoreError("Gagal menghitung tarif.");
    } finally {
      setCalcLoading(false);
    }
  }

  async function handleStore() {
    if (!selectedService || selectedId === null) return;
    setStoring(true);
    setStoreError("");
    try {
      const res = await fetch("/api/admin/delivery/store-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          destinationId: selectedId,
          destinationLabel: selectedLabel || undefined,
          service: {
            shippingName: selectedService.shippingName,
            serviceName: selectedService.serviceName,
            shippingCost: selectedService.shippingCost,
            shippingCashback: selectedService.shippingCashback,
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        onDone();
      } else {
        setStoreError(json.message ?? "Gagal membuat pengiriman.");
      }
    } catch {
      setStoreError("Gagal membuat pengiriman.");
    } finally {
      setStoring(false);
    }
  }

  const services = calculate
    ? [
        { title: "Reguler", list: calculate.reguler, show: true },
        { title: "Cargo", list: calculate.cargo, show: true },
        { title: "Instant", list: calculate.instant, show: true },
      ].filter((g) => g.list.length > 0)
    : [];

  const r = data.receiver;

  return (
    <Modal isOpen onClose={onClose} title={`Buat Pengiriman — ${order.orderNumber}`} size="lg">
      <div className="space-y-4 text-sm">
        {/* Ringkasan paket */}
        <div className="bg-accent/40 border border-border rounded-sm px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
          <div className="col-span-2">
            <p className="font-medium text-primary">{r.name}</p>
            <p className="text-muted">{r.phone}</p>
            <p className="text-muted">
              {r.street}, {r.district}, {r.city}, {r.province} {r.postalCode}
            </p>
            {r.locationLabel && <p className="text-muted">Lokasi: {r.locationLabel}</p>}
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Berat</span>
            <span className="font-medium">{data.weightKg} kg</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Nilai Barang</span>
            <span className="font-medium">{formatPrice(data.itemValue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Kurir Order</span>
            <span className="font-medium">{data.order.courier ?? "—"} {data.order.courierService ?? ""}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Kurir Preferensi</span>
            <span className="font-medium">{data.preferredCourier ?? "—"}</span>
          </div>
        </div>

        {!data.shipperReady && (
          <p className="text-xs text-warning">
            Wilayah asal pengirim belum diatur di Settings Komship — tarif tidak bisa dihitung.
          </p>
        )}

        {/* Pilih wilayah tujuan */}
        <div>
          <p className="text-xs font-semibold text-primary mb-1.5">1. Wilayah Tujuan</p>
          {!searching && destResults.length === 0 && !searchError && (
            <p className="text-[11px] text-muted mb-1.5">
              Auto-terisi dari alamat order (kode pos/kecamatan). Bisa dicari ulang di bawah.
            </p>
          )}
          <input
            type="text"
            value={destQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Cari kode pos / kecamatan / kota tujuan..."
            className={inputCls}
          />
          {searching && <p className="text-[11px] text-muted mt-1">Mencari...</p>}
          {searchError && <p className="text-[11px] text-destructive mt-1">{searchError}</p>}
          {destResults.length > 0 && (
            <div className="mt-1.5 border border-border rounded-sm max-h-40 overflow-auto divide-y divide-border">
              {destResults.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => selectDestination(d)}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-accent/50 transition-colors ${selectedId === d.id ? "bg-primary/5" : ""}`}
                >
                  <span className="font-medium">{d.label}</span>
                  <span className="block text-[10px] text-muted">
                    {d.subdistrict_name} · {d.city_name} · {d.zip_code}
                  </span>
                </button>
              ))}
            </div>
          )}
          {selectedId !== null && selectedLabel && !destQuery && (
            <p className="text-[11px] text-success mt-1.5">✓ Tujuan: {selectedLabel}</p>
          )}
        </div>

        {/* Tarif */}
        <div>
          <p className="text-xs font-semibold text-primary mb-1.5">2. Pilih Layanan &amp; Tarif</p>
          {calcLoading ? (
            <p className="text-xs text-muted">Menghitung tarif...</p>
          ) : !calculate ? (
            <p className="text-xs text-muted">
              Pilih wilayah tujuan untuk melihat tarif dari semua kurir.
            </p>
          ) : services.length === 0 ? (
            <p className="text-xs text-muted">Tidak ada layanan tersedia untuk rute ini.</p>
          ) : (
            <div className="space-y-2">
              {services.map((g) => (
                <div key={g.title} className="border border-border rounded-sm overflow-hidden">
                  <p className="px-3 py-1.5 bg-accent/40 text-[10px] font-semibold uppercase tracking-wide text-muted">
                    {g.title}
                  </p>
                  <div className="divide-y divide-border">
                    {g.list.map((s) => (
                      <button
                        key={`${s.shippingName}-${s.serviceName}`}
                        type="button"
                        onClick={() => setSelectedService(s)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-xs text-left hover:bg-accent/50 transition-colors ${selectedService?.shippingName === s.shippingName && selectedService?.serviceName === s.serviceName ? "bg-primary/5" : ""}`}
                      >
                        <input
                          type="radio"
                          checked={selectedService?.shippingName === s.shippingName && selectedService?.serviceName === s.serviceName}
                          onChange={() => setSelectedService(s)}
                          className="accent-primary"
                        />
                        <span className="flex-1 min-w-0">
                          <span className="font-semibold uppercase">{s.shippingName}</span>{" "}
                          <span className="text-muted">{s.serviceName}</span>
                        </span>
                        {s.etd && <span className="text-muted">ETD {s.etd}</span>}
                        <span className="font-medium">{formatPrice(s.shippingCostNet)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {storeError && <p className="text-xs text-destructive">{storeError}</p>}

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="primary"
            loading={storing}
            disabled={!selectedService || selectedId === null}
            onClick={handleStore}
          >
            Buat Pengiriman
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// =============================================================================
// MODAL JADWALKAN PICKUP
// =============================================================================

function PickupModal({
  orderId,
  orderNumber,
  weightKg,
  onClose,
  onDone,
}: {
  orderId: string;
  orderNumber: string;
  weightKg: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [pickupVehicle, setPickupVehicle] = useState<string>(KOMSHIP_PICKUP_VEHICLES[0]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<{ awb: string | null; orderNo: string } | null>(null);

  function validate() {
    if (!pickupDate || !pickupTime) return "Isi tanggal & jam pickup.";
    const minTime = new Date(Date.now() + 90 * 60 * 1000);
    const [hh, mm] = pickupTime.split(":").map(Number);
    const dt = new Date(`${pickupDate}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`);
    if (dt < minTime) {
      return "Pickup minimal 90 menit dari sekarang.";
    }
    // Aturan kendaraan per dokumen resmi: motor maks 5 kg/order, truk wajib >=10 kg
    if (pickupVehicle === "Motor" && weightKg > 5) {
      return `Kendaraan Motor maksimal 5 kg per order — berat paket ${weightKg} kg. Pilih Mobil atau Truk.`;
    }
    if (pickupVehicle === "Truk" && weightKg < 10) {
      return `Kendaraan Truk hanya untuk paket minimal 10 kg — berat paket ${weightKg} kg. Pilih Motor atau Mobil.`;
    }
    return "";
  }

  async function handleSubmit() {
    const v = validate();
    if (v) {
      setErrorMsg(v);
      return;
    }
    setErrorMsg("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/delivery/pickup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, pickupDate, pickupTime, pickupVehicle }),
      });
      const json = await res.json();
      if (json.success) {
        setResult({ awb: json.data.awb ?? null, orderNo: json.data.orderNo });
        onDone();
      } else {
        setErrorMsg(json.message ?? "Gagal menjadwalkan pickup.");
      }
    } catch {
      setErrorMsg("Gagal menjadwalkan pickup.");
    } finally {
      setSubmitting(false);
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <Modal isOpen onClose={onClose} title={`Jadwalkan Pickup — ${orderNumber}`}>
      <div className="space-y-4 text-sm">
        <p className="text-xs text-muted">
          Kurir menjemput paket ke alamat pengirim (Settings → Pengiriman → Alamat Pengirim).
          Minimal 90 menit dari sekarang.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium">Tanggal</span>
            <input type="date" min={todayStr} value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className={`${inputCls} mt-1`} />
          </label>
          <label className="block">
            <span className="text-xs font-medium">Jam</span>
            <input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className={`${inputCls} mt-1`} />
          </label>
        </div>
        <label className="block">
          <span className="text-xs font-medium">Kendaraan</span>
          <select
            value={pickupVehicle}
            onChange={(e) => setPickupVehicle(e.target.value)}
            className={`${inputCls} mt-1`}
          >
            {KOMSHIP_PICKUP_VEHICLES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <span className="block text-[10px] text-muted mt-1">
            Motor: ≤ 5kg/order · Mobil: 5–10kg · Truk: ≥ 10kg
          </span>
        </label>

        {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
        {result && (
          <div className="text-xs text-success bg-success/5 border border-success/20 rounded-sm px-3 py-2">
            ✓ Pickup dijadwalkan. AWB: <span className="font-mono">{result.awb ?? "—"}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button variant="primary" loading={submitting} onClick={handleSubmit}>
            Jadwalkan
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// =============================================================================
// MODAL CETAK LABEL
// =============================================================================

function LabelModal({
  order,
  onClose,
  onDone,
}: {
  order: DeliveryOrderInfo;
  onClose: () => void;
  onDone: () => void;
}) {
  const [page, setPage] = useState<string>(KOMSHIP_LABEL_PAGES[0].value);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [generated, setGenerated] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/delivery/label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, page }),
      });
      const json = await res.json();
      if (json.success && json.data.base64) {
        const b64 = String(json.data.base64).replace(/^data:application\/pdf;base64,/, "");
        const bytes = atob(b64);
        const arr = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
        const blob = new Blob([arr], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = json.data.fileName ?? `label-${order.orderNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        setGenerated(true);
        onDone();
      } else {
        setErrorMsg(json.message ?? "Gagal membuat label.");
      }
    } catch {
      setErrorMsg("Gagal membuat label.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={`Cetak Label — ${order.orderNumber}`}>
      <div className="space-y-4 text-sm">
        <p className="text-xs text-muted">
          Pilih format label. Setelah di-generate, PDF akan langsung terunduh.
        </p>
        <div className="space-y-1.5">
          {KOMSHIP_LABEL_PAGES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPage(p.value)}
              className={`w-full text-left px-3 py-2 border rounded-sm text-xs transition-colors ${page === p.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
        {generated && (
          <p className="text-xs text-success bg-success/5 border border-success/20 rounded-sm px-3 py-2">
            ✓ Label berhasil di-generate &amp; diunduh.
          </p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" onClick={onClose}>Tutup</Button>
          <Button variant="primary" loading={loading} onClick={handleGenerate}>
            Generate &amp; Unduh
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// =============================================================================
// MODAL LACAK — riwayat tracking
// =============================================================================

function TrackModal({ order, onClose }: { order: DeliveryOrderInfo; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [history, setHistory] = useState<KomshipHistoryEntry[]>([]);
  const [lastStatus, setLastStatus] = useState("");
  const [courier, setCourier] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/delivery/track?orderId=${order.id}`);
        const json = await res.json();
        if (cancelled) return;
        if (json.success) {
          setHistory(json.data.history ?? []);
          setLastStatus(json.data.lastStatus ?? "");
          setCourier(json.data.courier ?? "");
        } else {
          setErrorMsg(json.message ?? "Gagal mengambil riwayat.");
        }
      } catch {
        if (!cancelled) setErrorMsg("Gagal mengambil riwayat.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [order.id]);

  return (
    <Modal isOpen onClose={onClose} title={`Lacak Pengiriman — ${order.orderNumber}`} size="md">
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">
            Resi: <span className="font-mono font-medium text-primary">{order.trackingNumber}</span>
            {courier && <span className="ml-1.5">({courier})</span>}
          </span>
          {lastStatus && <Badge variant={DELIVERY_STATUS_VARIANTS[lastStatus] ?? "default"}>{lastStatus}</Badge>}
        </div>

        {loading ? (
          <p className="text-xs text-muted py-4 text-center">Memuat riwayat...</p>
        ) : errorMsg ? (
          <p className="text-xs text-destructive py-4 text-center">{errorMsg}</p>
        ) : history.length === 0 ? (
          <p className="text-xs text-muted py-4 text-center">Belum ada riwayat.</p>
        ) : (
          <div className="max-h-80 overflow-auto pr-1">
            {history.map((h, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${idx === 0 ? "bg-primary" : "bg-border"}`} />
                  {idx < history.length - 1 && <div className="w-px flex-1 bg-border" />}
                </div>
                <div className={`pb-4 ${idx === 0 ? "" : ""}`}>
                  <p className="text-xs font-medium">{h.desc || h.status || "—"}</p>
                  <p className="text-[10px] text-muted mt-0.5">
                    {h.date} {h.code ? `· ${h.code}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-1">
          <Button variant="secondary" onClick={onClose}>Tutup</Button>
        </div>
      </div>
    </Modal>
  );
}

// =============================================================================
// MODAL DETAIL — detail order pengiriman dari Komship
// =============================================================================

function DetailModal({ order, onClose }: { order: DeliveryOrderInfo; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [detail, setDetail] = useState<KomshipOrderDetail | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/delivery/detail?orderId=${order.id}`);
        const json = await res.json();
        if (cancelled) return;
        if (json.success) {
          setDetail(json.data);
        } else {
          setErrorMsg(json.message ?? "Gagal mengambil detail.");
        }
      } catch {
        if (!cancelled) setErrorMsg("Gagal mengambil detail.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [order.id]);

  const rows: Array<[string, React.ReactNode]> = detail
    ? [
        ["No. Order", <span key="a" className="font-mono">{detail.orderNo}</span>],
        ["AWB", <span key="b" className="font-mono">{detail.awb ?? "—"}</span>],
        ["Status", detail.orderStatus],
        ["Tanggal", detail.orderDate],
        ["Kurir", `${detail.shipping} ${detail.shippingType}`],
        ["Pembayaran", detail.paymentMethod],
        ["Pengirim", `${detail.shipperName} (${detail.brandName})`],
        ["Penerima", detail.receiverName],
        ["Alamat", <span key="c" className="block">{detail.receiverAddress}</span>],
        ["Ongkir", formatPrice(detail.shippingCost)],
        ["Asuransi", formatPrice(detail.insuranceValue)],
        ["Total", <b key="d">{formatPrice(detail.grandTotal)}</b>],
        ["Driver", detail.driverName ? `${detail.driverName} ${detail.driverPhone ?? ""}` : "—"],
        ["Tracking Live", detail.liveTrackingUrl ? (
          <a key="e" href={detail.liveTrackingUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
            Buka
          </a>
        ) : "—"],
      ]
    : [];

  return (
    <Modal isOpen onClose={onClose} title={`Detail Pengiriman — ${order.orderNumber}`} size="md">
      <div className="space-y-3 text-sm">
        {loading ? (
          <p className="text-xs text-muted py-4 text-center">Memuat detail...</p>
        ) : errorMsg ? (
          <p className="text-xs text-destructive py-4 text-center">{errorMsg}</p>
        ) : (
          <div className="divide-y divide-border border border-border rounded-sm">
            {rows.map(([label, value], i) => (
              <div key={i} className="flex justify-between gap-4 px-3 py-2 text-xs">
                <span className="text-muted shrink-0">{label}</span>
                <span className="text-right min-w-0">{value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-1">
          <Button variant="secondary" onClick={onClose}>Tutup</Button>
        </div>
      </div>
    </Modal>
  );
}
