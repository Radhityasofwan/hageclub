"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatPrice } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/client";
import type { CourierCost, ShippingConfig, ShippingErrorItem } from "@/types";

interface ShippingSelectorProps {
  destinationId: string;
  weight: number;
  selectedCourier: { name: string; service: string; cost: number } | null;
  onChange: (courier: { name: string; service: string; cost: number }) => void;
  error?: string;
  freeShipping?: boolean;
}

export function ShippingSelector({
  destinationId,
  weight,
  selectedCourier,
  onChange,
  error,
  freeShipping = false,
}: ShippingSelectorProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [courierCosts, setCourierCosts] = useState<CourierCost[]>([]);
  const [costErrors, setCostErrors] = useState<ShippingErrorItem[]>([]);
  const [config, setConfig] = useState<ShippingConfig | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Muat konfigurasi ongkir (origin, kurir aktif) dari server
  useEffect(() => {
    fetch("/api/shipping/config")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setConfig(json.data ?? null);
      })
      .catch(() => {})
      .finally(() => setConfigLoaded(true));
  }, []);

  // Hitung ongkir saat wilayah tujuan & origin tersedia
  useEffect(() => {
    if (!config?.configured || !config.originCityId || !destinationId || weight <= 0) {
      setCourierCosts([]);
      setCostErrors([]);
      return;
    }

    const cfg = config;
    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        const res = await fetch("/api/shipping/cost", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin: cfg.originCityId,
            destination: destinationId,
            weight,
            couriers: cfg.couriers,
          }),
        });
        const json = await res.json();
        if (!cancelled) {
          const result = json.data ?? { costs: [], errors: [] };
          setCourierCosts(result.costs ?? []);
          setCostErrors(result.errors ?? []);
        }
      } catch {
        // silent — UI menampilkan hasil kosong
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    return () => {
      cancelled = true;
    };
  }, [config, destinationId, weight]);

  if (configLoaded && !config?.configured) {
    return (
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold tracking-widest uppercase">
          {t("checkout.shippingMethod")}
        </legend>
        <p className="text-sm text-muted bg-accent/60 rounded-sm px-3 py-2.5">
          {t("shipping.notConfigured")}
        </p>
      </fieldset>
    );
  }

  const failedCount = costErrors.length;
  const showOptions = !loading && courierCosts.length > 0;
  const noCosts = !loading && courierCosts.length === 0 && costErrors.length === 0;

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold tracking-widest uppercase">
        {t("checkout.shippingMethod")}
      </legend>

      {freeShipping && (
        <div className="flex items-center gap-2 bg-success/10 border border-success/30 rounded-sm px-3 py-2.5">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-success shrink-0" aria-hidden="true">
            <path d="M4 8.5l2.5 2.5L12 5.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-xs font-medium text-success">{t("cart.freeShippingQualified")}</p>
        </div>
      )}

      {!destinationId ? (
        <p className="text-sm text-muted">{t("checkout.selectCityForShipping")}</p>
      ) : loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : showOptions ? (
        <div className="space-y-2">
          {courierCosts.map((courier) =>
            courier.services.map((svc) => (
              <ShippingOption
                key={`${courier.courier}-${svc.service}`}
                courier={courier.courier.toUpperCase()}
                service={svc.service}
                description={svc.description}
                cost={svc.cost}
                etd={svc.etd}
                freeShipping={freeShipping}
                selected={
                  selectedCourier?.name === courier.courier &&
                  selectedCourier?.service === svc.service
                }
                onClick={() =>
                  onChange({ name: courier.courier, service: svc.service, cost: freeShipping ? 0 : svc.cost })
                }
              />
            ))
          )}

          {failedCount > 0 && (
            <p className="text-xs text-muted">
              {t("shipping.someCouriersFailed", { count: failedCount })}
            </p>
          )}
        </div>
      ) : noCosts ? (
        <p className="text-sm text-muted bg-accent/60 rounded-sm px-3 py-2.5">
          {costErrors.some((e) => e.code === "NOT_CONFIGURED")
            ? t("shipping.notConfigured")
            : t("checkout.noShippingOptions")}
        </p>
      ) : costErrors.length > 0 ? (
        <div>
          <p className="text-sm text-muted bg-accent/60 rounded-sm px-3 py-2.5 mb-2">
            {t("checkout.noShippingOptions")}
          </p>
          {costErrors.length <= 2 && (
            <p className="text-xs text-muted">
              {costErrors.map((e) => e.message).join(" ")}
            </p>
          )}
        </div>
      ) : null}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </fieldset>
  );
}

function ShippingOption({
  courier,
  service,
  description,
  cost,
  etd,
  selected,
  freeShipping,
  onClick,
}: {
  courier: string;
  service: string;
  description: string;
  cost: number;
  etd: string;
  selected: boolean;
  freeShipping?: boolean;
  onClick: () => void;
}) {
  const { t } = useI18n();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-3 border rounded-sm text-left transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      )}
    >
      <div
        className={cn(
          "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
          selected ? "border-primary" : "border-muted"
        )}
      >
        {selected && <div className="w-2 h-2 rounded-full bg-primary" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold">{courier}</span>
          <span className="text-xs text-muted">{service}</span>
        </div>
        {description && (
          <p className="text-[11px] text-muted truncate">{description}</p>
        )}
        {etd && (
          <p className="text-[11px] text-muted">{t("checkout.shippingEstimate", { etd })}</p>
        )}
      </div>
      {freeShipping ? (
        <span className="text-sm font-semibold text-success shrink-0">
          {t("cart.freeShippingFree")}
        </span>
      ) : (
        <span className="text-sm font-semibold shrink-0">{formatPrice(cost)}</span>
      )}
    </button>
  );
}
