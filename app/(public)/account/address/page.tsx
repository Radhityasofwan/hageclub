"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LocationSearch } from "@/components/checkout/location-search";
import { useI18n } from "@/lib/i18n/client";
import type { V2Destination } from "@/types";

interface Address {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  street: string;
  district: string;
  city: string;
  province: string;
  postalCode: string;
  locationId: string | null;
  locationLabel: string | null;
  isDefault: boolean;
}

export default function AddressPage() {
  const { data: session } = useSession();
  const { t } = useI18n();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [locationError, setLocationError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null);
  const [deleting, setDeleting] = useState(false);

  const emptyForm = {
    label: "",
    recipientName: "",
    phone: "",
    street: "",
    district: "",
    city: "",
    province: "",
    postalCode: "",
    locationId: "",
    locationLabel: "",
    isDefault: false,
  };
  const [form, setForm] = useState(emptyForm);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function fetchAddresses() {
    try {
      const res = await fetch("/api/account/addresses");
      const json = await res.json();
      setAddresses(json.data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session?.user) fetchAddresses();
  }, [session]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setLocationError("");
  }

  function handleEdit(addr: Address) {
    setForm({
      label: addr.label,
      recipientName: addr.recipientName,
      phone: addr.phone,
      street: addr.street,
      district: addr.district ?? "",
      city: addr.city ?? "",
      province: addr.province ?? "",
      postalCode: addr.postalCode ?? "",
      locationId: addr.locationId ?? "",
      locationLabel: addr.locationLabel ?? "",
      isDefault: addr.isDefault,
    });
    setEditingId(addr.id);
    setShowForm(true);
    setLocationError("");
  }

  function handleLocationSelect(location: V2Destination) {
    const zip = /^\d{5}$/.test(location.zip_code) ? location.zip_code : "";
    setForm((prev) => ({
      ...prev,
      locationId: String(location.id),
      locationLabel: location.label,
      province: location.province_name,
      city: location.city_name,
      district: location.subdistrict_name || location.district_name,
      postalCode: zip || prev.postalCode,
    }));
    setLocationError("");
  }

  function handleLocationClear() {
    setForm((prev) => ({
      ...prev,
      locationId: "",
      locationLabel: "",
      province: "",
      city: "",
      district: "",
      postalCode: "",
    }));
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/account/addresses?id=${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok) {
        setAddresses((prev) => prev.filter((a) => a.id !== deleteTarget.id));
        showToast(json.message ?? t("account.deleted"));
        setDeleteTarget(null);
      }
    } catch {
      // silent
    } finally {
      setDeleting(false);
    }
  }

  async function handleSetDefault(id: string) {
    const addr = addresses.find((a) => a.id === id);
    if (!addr) return;
    try {
      const res = await fetch("/api/account/addresses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...addr, isDefault: true }),
      });
      if (res.ok) {
        setAddresses((prev) =>
          prev.map((a) => ({ ...a, isDefault: a.id === id }))
        );
        showToast(t("account.defaultUpdated"));
      }
    } catch {
      // silent
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.locationId) {
      setLocationError(t("validation.requiredLocation"));
      return;
    }
    const method = editingId ? "PUT" : "POST";
    const body = editingId
      ? { id: editingId, ...form, locationId: form.locationId || undefined, locationLabel: form.locationLabel || undefined }
      : { ...form, locationId: form.locationId || undefined, locationLabel: form.locationLabel || undefined };

    try {
      const res = await fetch("/api/account/addresses", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.ok) {
        await fetchAddresses();
        showToast(json.message ?? t("account.saved"));
        resetForm();
      }
    } catch {
      // silent
    }
  }

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const selectedLocation =
    form.locationId && form.locationLabel
      ? { id: form.locationId, label: form.locationLabel }
      : null;

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 space-y-6 md:max-w-3xl md:py-10">
        <h1 className="text-xl font-bold">{t("account.addressTitle")}</h1>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6 md:max-w-3xl md:py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("account.addressTitle")}</h1>
        {!showForm && (
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            + {t("account.addAddress")}
          </Button>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="bg-success/10 text-success text-xs rounded-lg px-3 py-2">
          {toast}
        </div>
      )}

      {/* Address list */}
      {!showForm && addresses.length === 0 && (
        <div className="text-center py-10 border border-border rounded-xl">
          <p className="text-sm text-muted">{t("account.noAddress")}</p>
        </div>
      )}

      {!showForm && addresses.map((addr) => (
        <div key={addr.id} className="border border-border rounded-xl p-4 relative">
          {addr.isDefault && (
            <span className="absolute top-3 right-3 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-lg uppercase">
              {t("account.defaultBadge")}
            </span>
          )}
          <p className="text-sm font-semibold">{addr.label}</p>
          <p className="text-sm">{addr.recipientName} — {addr.phone}</p>
          <p className="text-xs text-muted">{addr.street}</p>
          <p className="text-xs text-muted">{addr.district}, {addr.city}, {addr.province} {addr.postalCode}</p>
          <div className="flex gap-2 mt-3 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => handleEdit(addr)}>{t("account.edit")}</Button>
            {!addr.isDefault && (
              <Button variant="ghost" size="sm" onClick={() => handleSetDefault(addr.id)}>{t("account.makeDefault")}</Button>
            )}
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteTarget(addr)}>{t("account.delete")}</Button>
          </div>
        </div>
      ))}

      {/* Add/Edit form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold">{editingId ? t("account.editAddress") : t("account.addAddressTitle")}</h2>

          <Input label={t("account.label")} placeholder={t("account.labelPlaceholder")} value={form.label} onChange={(e) => updateField("label", e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label={t("account.recipientName")} value={form.recipientName} onChange={(e) => updateField("recipientName", e.target.value)} required />
            <Input label={t("account.phone")} value={form.phone} onChange={(e) => updateField("phone", e.target.value)} required />
          </div>
          <Textarea
            label={t("account.fullAddress")}
            value={form.street}
            onChange={(e) => updateField("street", e.target.value)}
            required
            rows={3}
          />

          {/* Wilayah — RajaOngkir V2 */}
          <div>
            <p className="text-xs font-medium text-muted mb-1">{t("shipping.location")}</p>
            <LocationSearch
              selected={selectedLocation}
              onSelect={handleLocationSelect}
              onClear={handleLocationClear}
              error={locationError}
            />
          </div>
          <Input label={t("account.postalCode")} value={form.postalCode} onChange={(e) => updateField("postalCode", e.target.value)} maxLength={5} required />

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => updateField("isDefault", e.target.checked)} className="accent-primary" />
            {t("account.makeDefaultCheck")}
          </label>

          <div className="flex gap-2">
            <Button variant="primary" type="submit">{t("account.save")}</Button>
            <Button variant="secondary" type="button" onClick={resetForm}>{t("account.cancel")}</Button>
          </div>
        </form>
      )}

      {/* Modal konfirmasi hapus alamat */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={t("account.delete")}
        message={t("account.deleteConfirm")}
        confirmLabel={t("account.delete")}
        danger
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
