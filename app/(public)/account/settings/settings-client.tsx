"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { LocationSearch } from "@/components/checkout/location-search";
import type { V2Destination } from "@/types";

type Tab = "profile" | "address" | "security" | "logout";

interface Props {
  initials: string;
  fullName: string;
  email: string;
  birthDate: string | null;
}

const MONTHS_ID = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];
const MONTHS_EN = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function parseBirthDate(iso: string | null) {
  if (!iso) return { day: "", month: "", year: "" };
  const d = new Date(iso);
  return {
    day: String(d.getUTCDate()),
    month: String(d.getUTCMonth() + 1),
    year: String(d.getUTCFullYear()),
  };
}

export function AccountSettingsClient({ initials, fullName, email, birthDate }: Props) {
  const { t } = useI18n();
  const router = useRouter();

  const [displayTab, setDisplayTab] = useState<Tab>("profile");
  const [fading, setFading] = useState(false);

  function switchTab(tab: Tab) {
    if (tab === displayTab) return;
    setFading(true);
    setTimeout(() => {
      setDisplayTab(tab);
      setFading(false);
    }, 140);
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "profile",  label: t("account.profileSetting"),  icon: <IconProfile /> },
    { key: "address",  label: t("account.addressSetting"),  icon: <IconAddress /> },
    { key: "security", label: t("account.accountSecurity"), icon: <IconLock /> },
    { key: "logout",   label: t("nav.signOut"),             icon: <IconLogout /> },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="max-w-md mx-auto px-4 py-6 space-y-6 md:max-w-3xl md:py-10">

        {/* Page header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-accent transition-colors text-muted hover:text-primary shrink-0"
            aria-label="Kembali"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 4L6 8l4 4" />
            </svg>
          </button>
          <h1 className="text-base font-bold text-primary">{t("account.settingsTitle")}</h1>
        </div>

        {/* Icon + label tab nav */}
        <div className="flex gap-1.5 p-1.5 bg-accent/50 border border-border rounded-2xl">
          {TABS.map((tab) => {
            const isActive = tab.key === displayTab;
            const isDestructive = tab.key === "logout";
            return (
              <button
                key={tab.key}
                onClick={() => switchTab(tab.key)}
                aria-label={tab.label}
                className={[
                  "flex-1 py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200",
                  isActive
                    ? isDestructive
                      ? "bg-destructive/10 text-destructive shadow-sm scale-[1.02]"
                      : "bg-white text-primary shadow-sm scale-[1.02]"
                    : isDestructive
                    ? "text-muted/40 hover:text-destructive/60 hover:bg-destructive/5"
                    : "text-muted/40 hover:text-muted hover:bg-white/60",
                ].join(" ")}
              >
                {tab.icon}
                <span className="text-[9px] font-medium leading-none tracking-wide">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab content with fade+slide animation */}
        <div
          className={`transition-all duration-150 ease-out ${
            fading ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
          }`}
        >
          {displayTab === "profile" && (
            <ProfileTab
              initials={initials}
              fullName={fullName}
              email={email}
              birthDate={birthDate}
            />
          )}
          {displayTab === "address" && <AddressTab />}
          {displayTab === "security" && <SecurityTab />}
          {displayTab === "logout" && <LogoutTab />}
        </div>
      </div>
    </div>
  );
}

/* ── Profile Tab ── */

function ProfileTab({
  fullName, email, birthDate,
}: {
  initials: string;
  fullName: string;
  email: string;
  birthDate: string | null;
}) {
  const { t, locale } = useI18n();
  const parsed = parseBirthDate(birthDate);

  const [name, setName] = useState(fullName);
  const [birthDay, setBirthDay] = useState(parsed.day);
  const [birthMonth, setBirthMonth] = useState(parsed.month);
  const [birthYear, setBirthYear] = useState(parsed.year);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (msgTimer.current) clearTimeout(msgTimer.current); }, []);

  const months = locale === "id" ? MONTHS_ID : MONTHS_EN;
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => currentYear - 13 - i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    const parts = name.trim().split(/\s+/);
    const firstName = parts[0] ?? "";
    const lastName = parts.slice(1).join(" ");

    let birthDateISO: string | null = null;
    if (birthDay && birthMonth && birthYear) {
      const m = String(birthMonth).padStart(2, "0");
      const d = String(birthDay).padStart(2, "0");
      birthDateISO = `${birthYear}-${m}-${d}`;
    }

    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, birthDate: birthDateISO }),
      });
      const json = await res.json();
      const ok = res.ok;
      setMsg({ text: json.message ?? (ok ? t("account.profileUpdated") : t("account.profileUpdateFailed")), ok });
      if (msgTimer.current) clearTimeout(msgTimer.current);
      msgTimer.current = setTimeout(() => setMsg(null), 4000);
    } catch {
      setMsg({ text: t("account.errorOccurred"), ok: false });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave}>
      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 pt-5 pb-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Info Profil Saya</p>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Nama */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground/70">
              {t("account.fullName")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={inputCls}
              placeholder={t("account.fullNamePlaceholder")}
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground/70">
              {t("auth.email")}
            </label>
            <input
              type="email"
              value={email}
              disabled
              className={`${inputCls} opacity-60 cursor-not-allowed bg-accent/40`}
            />
            <p className="text-[11px] text-muted">{t("account.emailLocked")}</p>
          </div>

          {/* Birthday section */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-medium text-muted whitespace-nowrap">
                {t("account.birthDate")}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <label className="block text-[10px] text-muted">{t("account.birthDay")}</label>
                <select value={birthDay} onChange={(e) => setBirthDay(e.target.value)} className={selectCls}>
                  <option value="">—</option>
                  {days.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] text-muted">{t("account.birthMonth")}</label>
                <select value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} className={selectCls}>
                  <option value="">—</option>
                  {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] text-muted">{t("account.birthYear")}</label>
                <select value={birthYear} onChange={(e) => setBirthYear(e.target.value)} className={selectCls}>
                  <option value="">—</option>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>

          {msg && (
            <p className={`text-xs ${msg.ok ? "text-success" : "text-destructive"}`}>{msg.text}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full h-11 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : t("account.saveChanges")}
          </button>
        </div>
      </div>
    </form>
  );
}

/* ── Address Tab ── */

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
  locationId?: string | null;
  locationLabel?: string | null;
  isDefault: boolean;
}

interface AddressForm {
  label: string;
  recipientName: string;
  phone: string;
  street: string;
  district: string;
  city: string;
  province: string;
  postalCode: string;
  locationId: string;
  locationLabel: string;
  isDefault: boolean;
}

const emptyForm: AddressForm = {
  label: "", recipientName: "", phone: "", street: "",
  district: "", city: "", province: "", postalCode: "",
  locationId: "", locationLabel: "", isDefault: false,
};

function AddressTab() {
  const { t } = useI18n();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSheet, setShowSheet] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [locationError, setLocationError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function fetchAddresses() {
    try {
      const res = await fetch("/api/account/addresses");
      const json = await res.json();
      setAddresses(json.data ?? []);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { fetchAddresses(); }, []);

  function openAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setLocationError("");
    setShowSheet(true);
  }

  function openEdit(addr: Address) {
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
    setLocationError("");
    setShowSheet(true);
  }

  function closeSheet() {
    setShowSheet(false);
    setTimeout(() => { setForm(emptyForm); setEditingId(null); }, 300);
  }

  function handleLocationSelect(loc: V2Destination) {
    const zip = /^\d{5}$/.test(loc.zip_code) ? loc.zip_code : "";
    setForm((prev) => ({
      ...prev,
      locationId: String(loc.id),
      locationLabel: loc.label,
      province: loc.province_name,
      city: loc.city_name,
      district: loc.subdistrict_name || loc.district_name,
      postalCode: zip || prev.postalCode,
    }));
    setLocationError("");
  }

  function handleLocationClear() {
    setForm((prev) => ({
      ...prev,
      locationId: "", locationLabel: "",
      province: "", city: "", district: "", postalCode: "",
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.locationId) {
      setLocationError("Pilih wilayah pengiriman terlebih dahulu");
      return;
    }
    setSubmitting(true);
    const method = editingId ? "PUT" : "POST";
    const body = editingId ? { id: editingId, ...form } : form;
    try {
      const res = await fetch("/api/account/addresses", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.ok) {
        await fetchAddresses();
        closeSheet();
        showToast(json.message ?? (editingId ? t("account.saved") : t("account.saved")));
      }
    } catch {}
    finally { setSubmitting(false); }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/account/addresses?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
        setDeleteConfirmId(null);
        showToast(t("account.deleted"));
      }
    } catch {}
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
        setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
        showToast(t("account.defaultUpdated"));
      }
    } catch {}
  }

  const selectedLocation =
    form.locationId && form.locationLabel
      ? { id: form.locationId, label: form.locationLabel }
      : null;

  return (
    <>
      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 pt-5 pb-4 border-b border-border flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">{t("account.addressSetting")}</p>
          <button
            onClick={openAdd}
            className="text-xs font-medium text-primary hover:underline"
          >
            + {t("account.addAddress")}
          </button>
        </div>

        <div className="px-6 py-5">
          {toast && (
            <div className="mb-4 bg-success/10 text-success text-xs rounded-xl px-3 py-2">
              {toast}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-accent/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : addresses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                <IconAddress size={20} className="text-muted" />
              </div>
              <p className="text-sm text-muted">{t("account.noAddress")}</p>
              <button
                onClick={openAdd}
                className="px-5 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors"
              >
                {t("account.addAddress")}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div key={addr.id} className="border border-border rounded-xl p-4 relative">
                  {addr.isDefault && (
                    <span className="absolute top-3 right-3 text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-lg">
                      {t("account.defaultBadge")}
                    </span>
                  )}
                  <p className="text-sm font-semibold text-foreground pr-14">{addr.label}</p>
                  <p className="text-xs text-muted mt-0.5">{addr.recipientName} · {addr.phone}</p>
                  <p className="text-xs text-muted">{addr.street}</p>
                  <p className="text-xs text-muted">{addr.city}, {addr.province}</p>

                  {deleteConfirmId === addr.id ? (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="flex-1 h-8 border border-border rounded-lg text-xs text-muted hover:text-primary transition-colors"
                      >
                        {t("account.cancel")}
                      </button>
                      <button
                        onClick={() => handleDelete(addr.id)}
                        className="flex-1 h-8 bg-destructive text-white rounded-lg text-xs font-medium hover:bg-destructive/90 transition-colors"
                      >
                        {t("account.delete")}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() => openEdit(addr)}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        {t("account.edit")}
                      </button>
                      {!addr.isDefault && (
                        <button
                          onClick={() => handleSetDefault(addr.id)}
                          className="text-xs text-muted hover:text-primary transition-colors"
                        >
                          {t("account.makeDefault")}
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteConfirmId(addr.id)}
                        className="text-xs text-muted/40 hover:text-destructive transition-colors ml-auto"
                      >
                        {t("account.delete")}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddressSheet
        isOpen={showSheet}
        editingId={editingId}
        form={form}
        setForm={setForm}
        locationError={locationError}
        submitting={submitting}
        selectedLocation={selectedLocation}
        onClose={closeSheet}
        onSubmit={handleSubmit}
        onLocationSelect={handleLocationSelect}
        onLocationClear={handleLocationClear}
      />
    </>
  );
}

/* ── Address Bottom Sheet ── */

interface SheetProps {
  isOpen: boolean;
  editingId: string | null;
  form: AddressForm;
  setForm: React.Dispatch<React.SetStateAction<AddressForm>>;
  locationError: string;
  submitting: boolean;
  selectedLocation: { id: string; label: string } | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onLocationSelect: (loc: V2Destination) => void;
  onLocationClear: () => void;
}

function AddressSheet({
  isOpen, editingId, form, setForm, locationError,
  submitting, selectedLocation, onClose, onSubmit,
  onLocationSelect, onLocationClear,
}: SheetProps) {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  function updateField(field: keyof AddressForm, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[70] bg-black/60 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-2xl shadow-2xl",
          "sheet-transition max-h-[92dvh] flex flex-col",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
          <h2 className="text-sm font-semibold text-foreground">
            {editingId ? t("account.editAddress") : t("account.addAddressTitle")}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent text-muted hover:text-primary transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 1l10 10M11 1L1 11" />
            </svg>
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          <form id="addr-sheet-form" onSubmit={onSubmit} className="px-5 py-5 space-y-4">
            {/* Label */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground/70">{t("account.label")}</label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => updateField("label", e.target.value)}
                required
                placeholder={t("account.labelPlaceholder")}
                className={inputCls}
              />
            </div>

            {/* Recipient + Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-foreground/70">{t("account.recipientName")}</label>
                <input
                  type="text"
                  value={form.recipientName}
                  onChange={(e) => updateField("recipientName", e.target.value)}
                  required
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-foreground/70">{t("account.phone")}</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  required
                  className={inputCls}
                />
              </div>
            </div>

            {/* Street */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground/70">{t("account.fullAddress")}</label>
              <textarea
                value={form.street}
                onChange={(e) => updateField("street", e.target.value)}
                required
                rows={3}
                className={`${inputCls} h-auto resize-none py-3 leading-relaxed`}
              />
            </div>

            {/* Location search */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-foreground/70">{t("shipping.location")}</p>
              <LocationSearch
                selected={selectedLocation}
                onSelect={onLocationSelect}
                onClear={onLocationClear}
                error={locationError}
              />
            </div>

            {/* Postal code */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground/70">{t("account.postalCode")}</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.postalCode}
                onChange={(e) => updateField("postalCode", e.target.value)}
                maxLength={5}
                required
                className={inputCls}
              />
            </div>

            {/* Default checkbox */}
            <label className="flex items-center gap-3 py-1 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => updateField("isDefault", e.target.checked)}
                className="accent-primary w-4 h-4 shrink-0"
              />
              <span className="text-sm text-foreground">{t("account.makeDefaultCheck")}</span>
            </label>
          </form>
        </div>

        {/* Sticky submit */}
        <div className="px-5 pb-6 pt-3 border-t border-border shrink-0">
          <button
            type="submit"
            form="addr-sheet-form"
            disabled={submitting}
            className="w-full h-11 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {submitting ? "Menyimpan..." : t("account.save")}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ── Security Tab ── */

function SecurityTab() {
  const { t } = useI18n();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (msgTimer.current) clearTimeout(msgTimer.current); }, []);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (form.newPassword !== form.confirmPassword) {
      setMsg({ text: t("account.passwordMismatch"), ok: false });
      return;
    }
    if (form.newPassword.length < 8) {
      setMsg({ text: t("account.passwordMinLength"), ok: false });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const json = await res.json();
      const ok = res.ok;
      setMsg({ text: json.message ?? (ok ? t("account.passwordUpdated") : t("account.passwordUpdateFailed")), ok });
      if (ok) setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      if (msgTimer.current) clearTimeout(msgTimer.current);
      msgTimer.current = setTimeout(() => setMsg(null), 4000);
    } catch {
      setMsg({ text: t("account.errorOccurred"), ok: false });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      if (res.ok) {
        await signOut({ callbackUrl: "/" });
      } else {
        const data = await res.json();
        setDeleteError(data.message ?? "Gagal menghapus akun.");
      }
    } catch {
      setDeleteError("Terjadi kesalahan, coba lagi.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handlePasswordSave}>
        <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 pt-5 pb-4 border-b border-border">
            <p className="text-sm font-semibold text-foreground">{t("account.changePassword")}</p>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground/70">{t("account.currentPassword")}</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={form.currentPassword}
                  onChange={(e) => update("currentPassword", e.target.value)}
                  required
                  className={`${inputCls} pr-10`}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary">
                  <EyeIcon show={showPw} />
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground/70">{t("account.newPassword")}</label>
              <input type={showPw ? "text" : "password"} value={form.newPassword} onChange={(e) => update("newPassword", e.target.value)} required className={inputCls} placeholder="Min. 8 karakter" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground/70">{t("account.confirmPassword")}</label>
              <input type={showPw ? "text" : "password"} value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} required className={inputCls} placeholder="Ulangi kata sandi baru" />
            </div>
            {msg && <p className={`text-xs ${msg.ok ? "text-success" : "text-destructive"}`}>{msg.text}</p>}
            <button type="submit" disabled={saving} className="w-full h-11 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50">
              {saving ? "Menyimpan..." : t("account.updatePassword")}
            </button>
          </div>
        </div>
      </form>

      <div className="pb-4">
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)} className="w-full text-xs text-muted/50 hover:text-destructive transition-colors py-2 text-center">
            {t("account.deleteAccount")}
          </button>
        ) : (
          <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-5 space-y-3">
            <p className="text-sm font-semibold text-destructive">{t("account.deleteAccount")}</p>
            <p className="text-xs text-muted leading-relaxed">{t("account.deleteAccountDesc")}</p>
            {deleteError && <p className="text-xs text-destructive">{deleteError}</p>}
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 h-10 border border-border rounded-xl text-sm text-muted hover:text-primary transition-colors">
                {t("account.cancel")}
              </button>
              <button onClick={handleDeleteAccount} disabled={deleting} className="flex-1 h-10 bg-destructive text-white rounded-xl text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-60">
                {deleting ? "Menghapus..." : "Ya, Hapus Akun"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Logout Tab ── */

function LogoutTab() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await signOut({ callbackUrl: "/" });
  }

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-8 flex flex-col items-center text-center gap-5">
        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
          <IconLogout size={24} className="text-destructive" />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-foreground">Keluar dari Akun?</p>
          <p className="text-xs text-muted leading-relaxed max-w-[220px]">
            Anda akan keluar dari sesi ini. Voucher dan pesanan tetap tersimpan.
          </p>
        </div>
        <button
          onClick={handleLogout}
          disabled={loading}
          className="w-full max-w-[240px] h-11 bg-destructive text-white text-sm font-semibold rounded-xl hover:bg-destructive/90 transition-colors disabled:opacity-60"
        >
          {loading ? "Keluar..." : t("nav.signOut")}
        </button>
      </div>
    </div>
  );
}

/* ── Shared styles ── */

const inputCls =
  "w-full h-11 px-4 border border-border rounded-xl text-sm bg-white placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors";

const selectCls =
  "w-full h-11 px-3 border border-border rounded-xl text-sm bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors appearance-none";

/* ── Icons ── */

function IconProfile({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="10" cy="7" r="3.5" />
      <path d="M2.5 18c0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5" />
    </svg>
  );
}

function IconAddress({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M10 2a6 6 0 016 6c0 4-6 10-6 10S4 12 4 8a6 6 0 016-6z" />
      <circle cx="10" cy="8" r="2" />
    </svg>
  );
}

function IconLock({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4" y="9" width="12" height="9" rx="2" />
      <path d="M7 9V6a3 3 0 016 0v3" />
      <circle cx="10" cy="13.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconLogout({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M13 3h4v14h-4M8.5 13.5L13 10l-4.5-3.5M13 10H3" />
    </svg>
  );
}

function EyeIcon({ show }: { show: boolean }) {
  if (show) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 2l12 12M6.5 6.6A2 2 0 0010.4 10M5 4.2C3 5.4 1.5 7.5 1.5 8S4 13 8 13c1.2 0 2.3-.3 3.2-.8M8 3c4 0 6.5 5 6.5 5s-.6 1.2-1.8 2.3" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}
