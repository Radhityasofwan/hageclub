"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { LocationSearch } from "@/components/checkout/location-search";
import { useShippingModalStore } from "@/stores/shipping-modal-store";
import { useSheetExit } from "@/hooks/use-sheet-exit";
import { formatPrice, cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/client";
import type { CourierCost, ShippingConfig, V2Destination } from "@/types";

interface ShippingEstimatorProps {
  weight: number; // grams
}

interface PickedLocation {
  id: string;
  label: string;
}

interface SavedAddress {
  id: string;
  label: string;
  locationId: string | null;
  locationLabel: string | null;
}

export function ShippingEstimator({ weight }: ShippingEstimatorProps) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { status } = useSession();
  const [config, setConfig] = useState<ShippingConfig | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<CourierCost[]>([]);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  // Panel hasil pencarian lokasi terbuka → modal ikut meninggi agar lega
  const [searchExpanded, setSearchExpanded] = useState(false);
  const closeModal = useCallback(() => setModalOpen(false), []);
  const { leaving, handleClose, visible } = useSheetExit(modalOpen, closeModal);
  const openShippingModal = useShippingModalStore((s) => s.openShippingModal);
  const closeShippingModal = useShippingModalStore((s) => s.closeShippingModal);

  useEffect(() => {
    fetch("/api/shipping/config")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setConfig(json.data ?? null);
      })
      .catch(() => {})
      .finally(() => setConfigLoaded(true));
  }, []);

  // Muat alamat tersimpan tiap modal dibuka (pengguna login)
  useEffect(() => {
    if (!modalOpen || status !== "authenticated") return;
    setAddressesLoading(true);
    fetch("/api/account/addresses")
      .then((r) => r.json())
      .then((json) => {
        const list = ((json.data ?? []) as SavedAddress[]).filter(
          (a) => a.locationId && a.locationLabel
        );
        setAddresses(list);
      })
      .catch(() => setAddresses([]))
      .finally(() => setAddressesLoading(false));
  }, [modalOpen, status]);

  // Body scroll lock + Escape saat modal terbuka; sinkronkan store agar
  // tombol floating lain (sticky bar mobile) ikut tersembunyi.
  useEffect(() => {
    if (!modalOpen) return;
    openShippingModal();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      closeShippingModal();
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [modalOpen, openShippingModal, closeShippingModal, handleClose]);

  async function runCheck(dest: PickedLocation) {
    if (!config?.configured || !config.originCityId) return;
    setChecking(true);
    setError("");
    setResults([]);
    try {
      const res = await fetch("/api/shipping/cost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: config.originCityId,
          destination: dest.id,
          weight: Math.max(250, weight),
          couriers: config.couriers,
        }),
      });
      const data = await res.json();
      const result = data.data ?? { costs: [], errors: [] };
      if (data.success && result.costs?.length > 0) {
        setResults(result.costs);
        if (result.errors?.length > 0) {
          setError(t("shipping.someCouriersFailed", { count: result.errors.length }));
        }
      } else if (data.success) {
        setError(t("shipping.failed"));
      } else {
        setError(t("shipping.failed"));
      }
    } catch {
      setError(t("shipping.connectionError"));
    } finally {
      setChecking(false);
    }
  }

  // Pilih lokasi (alamat tersimpan / hasil cari) → tutup modal → hitung otomatis
  function handlePick(loc: PickedLocation) {
    setLocation(loc);
    handleClose();
    runCheck(loc);
  }

  // "Mulai Rp…" — tarif termurah di semua layanan
  const cheapestCost = results.reduce<number | null>((min, c) => {
    for (const svc of c.services) {
      if (min === null || svc.cost < min) min = svc.cost;
    }
    return min;
  }, null);

  // Rentang estimasi hari (min–max dari semua layanan)
  const etdDays = results
    .flatMap((c) => c.services.map((s) => s.etd))
    .flatMap((etd) => (etd.match(/\d+/g) ?? []).map(Number))
    .filter(Boolean);
  const etdMin = etdDays.length ? Math.min(...etdDays) : null;
  const etdMax = etdDays.length ? Math.max(...etdDays) : null;
  const etdRange =
    etdMin === null ? null : etdMin === etdMax ? String(etdMin) : `${etdMin}–${etdMax}`;

  // Per kurir: layanan termurah
  const courierRows = results.map((c) => {
    const best = c.services.reduce((m, s) => (s.cost < m.cost ? s : m));
    return { courier: c.courier, service: best.service, cost: best.cost, etd: best.etd };
  });

  if (configLoaded && !config?.configured) {
    return (
      <div className="border border-border rounded-sm p-4">
        <h3 className="text-sm font-semibold mb-3">{t("shipping.estimatorTitle")}</h3>
        <p className="text-sm text-muted bg-accent/60 rounded-sm px-3 py-2.5">
          {t("shipping.notConfigured")}
        </p>
      </div>
    );
  }

  const canCheck = Boolean(config?.configured && config.originCityId);

  return (
    <div className="border border-border rounded-sm p-4 space-y-3">
      <h3 className="text-sm font-semibold">{t("shipping.estimatorTitle")}</h3>

      {/* Dikirim ke + Cek Ongkir / Ubah Lokasi */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted mb-0.5">{t("shipping.sentTo")}</p>
          {location ? (
            <p className="text-sm font-medium truncate">{location.label}</p>
          ) : (
            <p className="text-sm text-muted">{t("shipping.notSelected")}</p>
          )}
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="shrink-0"
          onClick={() => {
            // Cek ongkir khusus member — belum login → halaman akun
            if (status !== "authenticated") {
              router.push("/account");
              return;
            }
            setModalOpen(true);
          }}
          disabled={!canCheck}
        >
          {location ? t("shipping.changeLocation") : t("shipping.check")}
        </Button>
      </div>

      {!canCheck && (
        <p className="text-xs text-muted">{t("checkout.setOriginInAdmin")}</p>
      )}

      {checking && (
        <p className="text-xs text-muted flex items-center gap-1.5">
          <Spinner size="sm" />
          {t("shipping.calculating")}
        </p>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Ringkasan hasil — update otomatis setelah lokasi dipilih */}
      {results.length > 0 && cheapestCost !== null && (
        <div className="rounded-sm bg-accent/60 px-3 py-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">{t("shipping.estimatedCost")}</span>
            <span className="font-semibold">
              {t("shipping.startingAt", { price: formatPrice(cheapestCost, "IDR", locale) })}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">{t("shipping.weightLabel")}</span>
            <span className="font-medium">{Math.max(250, weight)} g</span>
          </div>
          {etdRange && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">{t("shipping.etaLabel")}</span>
              <span className="font-medium">
                {t("shipping.etaValue", { range: etdRange, s: etdRange === "1" ? "" : "s" })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Daftar kurir tersedia */}
      {results.length > 0 && (
        <div className="pt-1 border-t border-border space-y-1.5">
          {courierRows.map((row) => (
            <div key={row.courier} className="flex items-center justify-between text-sm gap-3">
              <div className="min-w-0">
                <span className="font-medium uppercase">{row.courier}</span>
                <span className="ml-2 text-xs text-muted">{row.service}</span>
              </div>
              <div className="text-right shrink-0">
                <span className="font-semibold">{formatPrice(row.cost, "IDR", locale)}</span>
                {row.etd && (
                  <span className="ml-2 text-xs text-muted">
                    ({t("shipping.etaValue", { range: row.etd, s: row.etd === "1" ? "" : "s" })})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 48 jam note */}
      <p className="text-[11px] text-muted flex items-start gap-1.5 pt-0.5">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5" aria-hidden="true">
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        {t("shipping.dispatchNote")}
      </p>

      {/* ── Modal: Bottom Sheet (HP) / Dialog (desktop) ── */}
      {visible && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t("shipping.selectLocation")}
        >
          {/* Backdrop */}
          <div
            className={cn(
              "absolute inset-0 bg-black/50 transition-opacity duration-300",
              modalOpen && !leaving ? "opacity-100" : "opacity-0"
            )}
            onClick={handleClose}
            aria-hidden="true"
          />

          <div
            className={cn(
              "relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-lg shadow-xl flex flex-col",
              "transition-[transform,opacity,max-height] duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
              searchExpanded ? "max-h-[96vh] sm:max-h-[92vh]" : "max-h-[85vh]",
              modalOpen && !leaving
                ? "translate-y-0 opacity-100"
                : "max-sm:translate-y-full sm:translate-y-2 sm:opacity-0"
            )}
          >
            {/* Handle bar — mobile */}
            <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
              <div className="w-10 h-1 rounded-full bg-neutral-300" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-1 sm:pt-4 pb-3 border-b border-border shrink-0">
              <h2 className="text-base font-semibold">{t("shipping.selectLocation")}</h2>
              <button
                type="button"
                onClick={handleClose}
                aria-label={t("common.close")}
                className="p-1.5 rounded text-muted hover:text-primary hover:bg-accent transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 overflow-y-auto flex-1 space-y-5">
              {/* Alamat tersimpan */}
              {status === "authenticated" && (
                <div>
                  <p className="text-xs font-semibold text-muted mb-2">
                    {t("shipping.savedAddresses")}
                  </p>
                  {addressesLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-14 w-full" />
                      <Skeleton className="h-14 w-full" />
                    </div>
                  ) : addresses.length === 0 ? (
                    <p className="text-xs text-muted">{t("shipping.noSavedAddresses")}</p>
                  ) : (
                    <div className="space-y-1.5">
                      {addresses.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => handlePick({ id: a.locationId!, label: a.locationLabel! })}
                          className="w-full text-left px-3 py-2.5 border border-border rounded-sm hover:bg-accent hover:border-primary/40 transition-colors"
                        >
                          <p className="text-sm font-medium">{a.label}</p>
                          <p className="text-xs text-muted truncate mt-0.5">{a.locationLabel}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Cari lokasi baru */}
              <div>
                <p className="text-xs font-semibold text-muted mb-2">
                  {t("shipping.searchLocation")}
                </p>
                <LocationSearch
                  onSelect={(loc: V2Destination) =>
                    handlePick({ id: String(loc.id), label: loc.label })
                  }
                  onOpenChange={setSearchExpanded}
                  listClassName="max-h-72"
                />
                {/* Spacer: saat panel hasil terbuka, badan modal memanjang halus
                    sehingga dropdown hasil pencarian terlihat penuh tanpa scroll. */}
                <div
                  className={cn(
                    "transition-[height] duration-300 ease-out",
                    searchExpanded ? "h-72" : "h-0"
                  )}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
