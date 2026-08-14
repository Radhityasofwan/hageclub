"use client";

import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/client";
import type { CheckoutCustomer } from "./types";

interface CustomerFormProps {
  value: CheckoutCustomer;
  onChange: (value: CheckoutCustomer) => void;
  errors: Partial<Record<keyof CheckoutCustomer, string>>;
}

export function CustomerForm({ value, onChange, errors }: CustomerFormProps) {
  const { t } = useI18n();

  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-semibold tracking-widest uppercase mb-4">
        {t("checkout.customerInfo")}
      </legend>

      <Input
        label={t("checkout.fullName")}
        placeholder={t("checkout.fullNamePlaceholder")}
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
        error={errors.name}
      />
      <Input
        label={t("checkout.email")}
        type="email"
        placeholder={t("checkout.emailPlaceholder")}
        value={value.email}
        onChange={(e) => onChange({ ...value, email: e.target.value })}
        error={errors.email}
      />
      <Input
        label={t("checkout.phone")}
        placeholder="08123456789"
        value={value.phone}
        onChange={(e) => onChange({ ...value, phone: e.target.value })}
        error={errors.phone}
        helperText={t("checkout.phonePlaceholder")}
      />
    </fieldset>
  );
}
