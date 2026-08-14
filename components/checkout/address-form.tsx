"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LocationSearch } from "./location-search";
import { useI18n } from "@/lib/i18n/client";
import type { V2Destination } from "@/types";
import type { CheckoutAddress } from "./types";

interface AddressFormProps {
  value: CheckoutAddress;
  onChange: (value: CheckoutAddress) => void;
  errors: Partial<Record<keyof CheckoutAddress, string>>;
  onCopyFromCustomer?: () => void;
}

export function AddressForm({ value, onChange, errors, onCopyFromCustomer }: AddressFormProps) {
  const { t } = useI18n();

  function handleLocationSelect(location: V2Destination) {
    // Prefill detail wilayah + kode pos dari hasil pencarian RajaOngkir
    const zip = /^\d{5}$/.test(location.zip_code) ? location.zip_code : "";
    onChange({
      ...value,
      locationId: String(location.id),
      locationLabel: location.label,
      province: location.province_name,
      city: location.city_name,
      district: location.subdistrict_name || location.district_name,
      postalCode: zip || value.postalCode,
    });
  }

  function handleLocationClear() {
    onChange({
      ...value,
      locationId: "",
      locationLabel: undefined,
      province: "",
      city: "",
      district: "",
      postalCode: "",
    });
  }

  const selected =
    value.locationId && value.locationLabel
      ? { id: value.locationId, label: value.locationLabel }
      : null;

  return (
    <fieldset className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <legend className="text-sm font-semibold tracking-widest uppercase">
          {t("checkout.shippingAddress")}
        </legend>
        {onCopyFromCustomer && (
          <button
            type="button"
            onClick={onCopyFromCustomer}
            className="inline-flex items-center gap-1.5 text-xs bg-primary/5 border border-primary/25 text-primary px-2.5 py-1 rounded-sm hover:bg-primary/10 transition-colors font-medium shrink-0"
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm-5 6a5 5 0 0110 0H3z"/>
            </svg>
            {t("checkout.copyFromCustomer")}
          </button>
        )}
      </div>

      <Input
        label={t("checkout.recipientName")}
        placeholder={t("checkout.recipientPlaceholder")}
        value={value.recipientName}
        onChange={(e) => onChange({ ...value, recipientName: e.target.value })}
        error={errors.recipientName}
      />
      <Input
        label={t("checkout.recipientPhone")}
        placeholder="08123456789"
        value={value.phone}
        onChange={(e) => onChange({ ...value, phone: e.target.value })}
        error={errors.phone}
      />

      <div>
        <p className="text-xs font-medium text-muted mb-1">{t("shipping.location")}</p>
        <LocationSearch
          selected={selected}
          onSelect={handleLocationSelect}
          onClear={handleLocationClear}
          error={errors.locationId}
        />
      </div>

      <Textarea
        label={t("checkout.fullAddress")}
        placeholder={t("checkout.fullAddressPlaceholder")}
        value={value.street}
        onChange={(e) => onChange({ ...value, street: e.target.value })}
        error={errors.street}
        rows={3}
      />
      <Input
        label={t("checkout.postalCode")}
        placeholder="12345"
        value={value.postalCode}
        onChange={(e) => onChange({ ...value, postalCode: e.target.value })}
        maxLength={5}
        error={errors.postalCode}
      />
    </fieldset>
  );
}
