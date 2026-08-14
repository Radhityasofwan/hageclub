"use client";

import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import { useCartStore } from "@/stores/cart-store";
import { useToast } from "@/components/ui/toast";
import { useCountdown } from "@/hooks/use-countdown";
import { useSheetExit } from "@/hooks/use-sheet-exit";
import { formatPrice, cn } from "@/lib/utils";
import { courierDisplayLabel } from "@/lib/rajaongkir-constants";
import { CopyBtn, copyText } from "@/components/checkout/copy-button";
import { PaymentAccordion, type AccordionItem } from "@/components/checkout/payment-accordion";
import type { KomercePaymentMethod } from "@/types";
import type { OrderDetail } from "@/types/order";

// ─── helpers ────────────────────────────────────────────────────────────────

// Tanggal day-first konsisten antar locale: "07 Agu 2026" / "07 Aug 2026"
function formatShortDate(date: Date | string, locale: string): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleDateString(locale, { month: "short" });
  return `${day} ${month} ${d.getFullYear()}`;
}

function formatTime(date: Date | string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(date));
}

// ─── Payment Method Bottom Sheet (fullscreen, same as checkout) ───────────────

// ─── Payment Method Bottom Sheet (fullscreen, same as checkout) ───────────────

interface PaymentSheetProps {
  open: boolean;
  onClose: () => void;
  methods: KomercePaymentMethod[];
  loading: boolean;
  onConfirm: (method: "VA" | "QRIS", bankCode?: string) => void;
  confirming: boolean;
}

function PaymentMethodSheet({
  open, onClose, methods, loading, onConfirm, confirming,
}: PaymentSheetProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"va" | "qris">("va");
  const [selectedBank, setSelectedBank] = useState<KomercePaymentMethod | null>(null);
  const { leaving, handleClose, visible } = useSheetExit(open, onClose);

  const vaMethods = methods.filter((m) => m.paymentType === "va");
  const qrisMethods = methods.filter((m) => m.paymentType === "qris");

  function handleConfirm() {
    if (leaving || confirming) return;
    handleClose();
    if (activeTab === "qris") {
      onConfirm("QRIS", undefined);
    } else if (selectedBank) {
      onConfirm("VA", selectedBank.bankCode);
    }
  }

  const canConfirm = activeTab === "qris" ? qrisMethods.length > 0 : selectedBank !== null;

  if (!visible) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col">
      <div
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300",
          open && !leaving ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
      />
      <div
        className={cn(
          "relative mt-auto sm:mt-0 sm:m-auto sm:w-full sm:max-w-lg bg-white flex flex-col h-full sm:h-auto sm:max-h-[90vh] sm:rounded-xl overflow-hidden sheet-transition",
          open && !leaving
            ? "translate-y-0 opacity-100"
            : "max-sm:translate-y-full sm:translate-y-2 sm:opacity-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold">{t("payment.selectMethodTitle")}</h2>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border shrink-0 px-5">
          {(["va", "qris"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {tab === "va" ? t("checkout.paymentTabVA") : t("checkout.paymentTabQRIS")}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-accent animate-pulse rounded-lg" />
              ))}
            </div>
          ) : activeTab === "va" ? (
            vaMethods.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">{t("checkout.noPaymentMethods")}</p>
            ) : (
              <div className="space-y-2">
                {vaMethods.map((m) => (
                  <button
                    key={m.bankCode}
                    type="button"
                    onClick={() => setSelectedBank(m)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                      selectedBank?.bankCode === m.bankCode
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    {m.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.logoUrl} alt={m.displayName} className="w-10 h-7 object-contain shrink-0" />
                    ) : (
                      <div className="w-10 h-7 bg-accent rounded flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-muted">{m.bankCode}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{m.displayName}</p>
                      <p className="text-xs text-muted">Virtual Account</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      selectedBank?.bankCode === m.bankCode ? "border-primary" : "border-border"
                    }`}>
                      {selectedBank?.bankCode === m.bankCode && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )
          ) : (
            qrisMethods.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">{t("checkout.noPaymentMethods")}</p>
            ) : (
              <div className="space-y-2">
                {qrisMethods.map((m) => (
                  <div key={m.bankCode ?? "qris"} className="flex items-center gap-3 p-3 rounded-xl border border-primary bg-primary/5">
                    {m.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.logoUrl} alt={m.displayName} className="w-10 h-7 object-contain shrink-0" />
                    ) : (
                      <div className="w-10 h-7 bg-accent rounded flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-muted">QR</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{m.displayName}</p>
                      <p className="text-xs text-muted">QRIS</p>
                    </div>
                    <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border shrink-0">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || confirming}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 transition-opacity"
          >
            {confirming ? t("common.loading") : t("checkout.confirm")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Edit Info Bottom Sheet ────────────────────────────────────────────────────

interface ShippingAddress {
  recipientName: string;
  phone: string;
  street: string;
  district: string;
  city: string;
  province: string;
  postalCode: string;
}

interface EditInfoForm {
  email: string;
  guestName: string;
  guestPhone: string;
  recipientName: string;
  phone: string;
  street: string;
  district: string;
  city: string;
  province: string;
  postalCode: string;
}

interface CourierOption {
  courier: string;
  service: string;
  description: string;
  cost: number;
  etd: string;
}

interface EditInfoSheetProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  isGuest: boolean;
  initialValues: EditInfoForm;
  initialCourier: string;
  initialCourierService: string;
  onSaved: (values: EditInfoForm & { courier?: string; courierService?: string; shippingCost?: number; total?: number; paymentUrl?: string | null; vaNumber?: string | null; vaBank?: string | null; expiresAt?: string | null; finalAmount?: number | null }) => void;
}

function EditInfoSheet({ open, onClose, orderId, isGuest, initialValues, initialCourier, initialCourierService, onSaved }: EditInfoSheetProps) {
  const { t, locale } = useI18n();
  const { leaving, handleClose, visible } = useSheetExit(open, onClose);
  const [form, setForm] = useState<EditInfoForm>(initialValues);
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState("");

  // Courier state
  const [courierOptions, setCourierOptions] = useState<CourierOption[]>([]);
  const [courierLoading, setCourierLoading] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState<CourierOption | null>(null);
  const [courierError, setCourierError] = useState("");

  // Reset form + fetch courier options when sheet opens
  useEffect(() => {
    if (!open) return;
    setForm(initialValues);
    setFieldError("");
    setCourierError("");
    setSelectedCourier(null);

    setCourierLoading(true);
    fetch(`/api/orders/${orderId}/shipping-options`)
      .then((r) => r.json())
      .then((j) => {
        const opts: CourierOption[] = j.data?.options ?? [];
        setCourierOptions(opts);
        // Pre-select current courier+service
        const current = opts.find(
          (o) => o.courier.toLowerCase() === initialCourier.toLowerCase() &&
                 o.service.toLowerCase() === initialCourierService.toLowerCase()
        );
        setSelectedCourier(current ?? null);
      })
      .catch(() => setCourierError("Gagal memuat opsi pengiriman"))
      .finally(() => setCourierLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function set(key: keyof EditInfoForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (saving) return;
    if (!form.recipientName.trim() || !form.phone.trim() || !form.street.trim()) {
      setFieldError("Nama penerima, nomor HP, dan alamat wajib diisi.");
      return;
    }
    setSaving(true);
    setFieldError("");
    try {
      // 1. Save customer + address info
      const body: Record<string, string> = {
        guestEmail: form.email,
        recipientName: form.recipientName,
        phone: form.phone,
        street: form.street,
        district: form.district,
        city: form.city,
        province: form.province,
        postalCode: form.postalCode,
      };
      if (isGuest) {
        body.guestName = form.guestName;
        body.guestPhone = form.guestPhone;
      }

      const infoRes = await fetch(`/api/orders/${orderId}/info`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const infoJson = await infoRes.json();
      if (!infoRes.ok) { setFieldError(infoJson.message ?? t("common.error")); return; }

      // 2. If courier changed, update it (will also recreate payment)
      let courierUpdate: ReturnType<typeof Object.assign> | undefined;
      const courierChanged =
        selectedCourier &&
        (selectedCourier.courier.toLowerCase() !== initialCourier.toLowerCase() ||
         selectedCourier.service.toLowerCase() !== initialCourierService.toLowerCase());

      if (courierChanged) {
        const cRes = await fetch(`/api/orders/${orderId}/courier`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courier: selectedCourier!.courier, service: selectedCourier!.service }),
        });
        const cJson = await cRes.json();
        if (!cRes.ok) { setFieldError(cJson.message ?? t("common.error")); return; }
        courierUpdate = cJson.data ?? cJson;
      }

      onSaved({ ...form, ...courierUpdate });
      handleClose();
    } catch {
      setFieldError(t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  if (!visible) return null;

  const inputCls = "w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary";
  const labelCls = "block text-xs text-muted mb-1";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col">
      <div
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300",
          open && !leaving ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
      />
      <div
        className={cn(
          "relative mt-auto bg-white dark:bg-background flex flex-col max-h-[92dvh] rounded-t-2xl overflow-hidden sm:m-auto sm:rounded-xl sm:w-full sm:max-w-md sm:max-h-[90vh] sheet-transition",
          open && !leaving
            ? "translate-y-0 opacity-100"
            : "max-sm:translate-y-full sm:translate-y-2 sm:opacity-0"
        )}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0 border-b border-border">
          <h2 className="text-base font-semibold">{t("payment.changeInfo")}</h2>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* ── Info Pemesan ── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-widest uppercase text-muted">Info Pemesan</p>
            {isGuest ? (
              <>
                <div>
                  <label className={labelCls}>Nama Lengkap</label>
                  <input className={inputCls} value={form.guestName} onChange={(e) => set("guestName", e.target.value)} placeholder="Nama lengkap" />
                </div>
                <div>
                  <label className={labelCls}>{t("payment.orderEmail")}</label>
                  <input className={inputCls} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@contoh.com" />
                </div>
                <div>
                  <label className={labelCls}>Nomor HP</label>
                  <input className={inputCls} type="tel" value={form.guestPhone} onChange={(e) => set("guestPhone", e.target.value)} placeholder="08xxxxxxxxxx" />
                </div>
              </>
            ) : (
              <div>
                <label className={labelCls}>{t("payment.orderEmail")}</label>
                <input
                  className={`${inputCls} bg-accent text-muted cursor-not-allowed`}
                  type="email"
                  value={form.email}
                  readOnly
                  disabled
                />
                <p className="text-[11px] text-muted mt-1">Email akun tidak dapat diubah dari sini.</p>
              </div>
            )}
          </div>

          {/* ── Metode Pengiriman ── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-widest uppercase text-muted">{t("payment.courierService")}</p>
            {courierLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-accent animate-pulse rounded-lg" />)}
              </div>
            ) : courierError ? (
              <p className="text-xs text-muted">{courierError}</p>
            ) : courierOptions.length === 0 ? (
              <p className="text-xs text-muted">Opsi pengiriman tidak tersedia (lokasi tujuan tidak ditemukan).</p>
            ) : (
              <div className="space-y-2">
                {courierOptions.map((opt) => {
                  const key = `${opt.courier}-${opt.service}`;
                  const isSelected = selectedCourier?.courier === opt.courier && selectedCourier?.service === opt.service;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedCourier(opt)}
                      className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors text-left ${
                        isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{opt.courier.toUpperCase()} {opt.service}</p>
                        <p className="text-xs text-muted">{opt.description} {opt.etd ? `· ${opt.etd}` : ""}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold">{formatPrice(opt.cost, "IDR", locale)}</p>
                        <div className={`w-4 h-4 rounded-full border-2 ml-auto mt-1 flex items-center justify-center ${isSelected ? "border-primary" : "border-border"}`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Alamat Penerima ── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-widest uppercase text-muted">{t("payment.recipient")}</p>
            <div>
              <label className={labelCls}>Nama Penerima</label>
              <input className={inputCls} value={form.recipientName} onChange={(e) => set("recipientName", e.target.value)} placeholder="Nama penerima paket" />
            </div>
            <div>
              <label className={labelCls}>Nomor HP Penerima</label>
              <input className={inputCls} type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="08xxxxxxxxxx" />
            </div>
            <div>
              <label className={labelCls}>Alamat Lengkap</label>
              <textarea
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                rows={3}
                value={form.street}
                onChange={(e) => set("street", e.target.value)}
                placeholder="Nama jalan, nomor rumah, RT/RW"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Kecamatan</label>
                <input className={inputCls} value={form.district} onChange={(e) => set("district", e.target.value)} placeholder="Kecamatan" />
              </div>
              <div>
                <label className={labelCls}>Kota / Kabupaten</label>
                <input className={inputCls} value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Kota" />
              </div>
              <div>
                <label className={labelCls}>Provinsi</label>
                <input className={inputCls} value={form.province} onChange={(e) => set("province", e.target.value)} placeholder="Provinsi" />
              </div>
              <div>
                <label className={labelCls}>Kode Pos</label>
                <input className={inputCls} value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} placeholder="Kode pos" />
              </div>
            </div>
          </div>

          {fieldError && <p className="text-xs text-destructive">{fieldError}</p>}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border shrink-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 transition-opacity"
          >
            {saving ? t("common.loading") : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Expired Payment Bottom Sheet (alert → redirect ke keranjang) ────────────

interface ExpiredSheetProps {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
  reordering?: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
}

function ExpiredSheet({ open, onClose, onContinue, reordering = false, t }: ExpiredSheetProps) {
  const { leaving, handleClose, visible } = useSheetExit(open, onClose);

  if (!visible) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col">
      <div
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300",
          open && !leaving ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
      />
      <div
        className={cn(
          "relative mt-auto bg-white dark:bg-background flex flex-col rounded-t-2xl overflow-hidden sm:m-auto sm:rounded-xl sm:w-full sm:max-w-md sheet-transition",
          open && !leaving
            ? "translate-y-0 opacity-100"
            : "max-sm:translate-y-full sm:translate-y-2 sm:opacity-0"
        )}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Body */}
        <div className="px-5 pt-2 pb-4">
          <h2 className="text-base font-bold">{t("payment.expiredAlertTitle")}</h2>
          <p className="text-sm text-muted mt-2 leading-relaxed">{t("payment.expiredAlertMessage")}</p>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (leaving) return;
              handleClose();
              onContinue();
            }}
            disabled={reordering}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {reordering ? t("common.loading") : t("payment.continueToCart")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────

export function CheckoutSuccessContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const orderNumber = searchParams.get("orderNumber");
  const { t, locale } = useI18n();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Payment state (may update after change-method / refresh)
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [vaNumber, setVaNumber] = useState<string | null>(null);
  const [vaBank, setVaBank] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [finalAmount, setFinalAmount] = useState<number | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);

  // Payment methods (for change-method sheet)
  const [paymentMethods, setPaymentMethods] = useState<KomercePaymentMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [expiredSheetOpen, setExpiredSheetOpen] = useState(false);
  const [reordering, setReordering] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const [changingMethod, setChangingMethod] = useState(false);

  // Edit info sheet
  const [editInfoOpen, setEditInfoOpen] = useState(false);

  // Cancel
  const [cancelling, setCancelling] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  // VA copy
  const [vaCopied, setVaCopied] = useState(false);

  // Countdown
  const countdown = useCountdown(expiresAt);

  // Auto-poll payment status every 5 s when PENDING
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const json = await res.json();
      if (!res.ok) { setError(json.message ?? t("common.error")); return; }
      const o: OrderDetail = json.data ?? json;
      setOrder(o);
      // Sync payment state from order
      const p = o.payment;
      if (p) {
        setPaymentMethod(p.method ?? "");
        setPaymentUrl(p.paymentUrl ?? null);
        setVaNumber(p.vaNumber ?? null);
        setVaBank(p.vaBank ?? null);
        setExpiresAt(p.expiresAt ?? null);
        setFinalAmount(p.finalAmount ?? null);
        if (p.status === "PAID") setIsPaid(true);
      }
      if (o.status === "CANCELLED") setIsCancelled(true);
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [orderId, t]);

  useEffect(() => {
    if (!orderId || !orderNumber) { router.replace("/"); return; }
    fetchOrder();
  }, [fetchOrder, orderId, orderNumber, router]);

  // Auto-poll when PENDING
  useEffect(() => {
    if (isPaid || isCancelled || !orderId) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/${orderId}/status`);
        const json = await res.json();
        const data = json.data ?? json;
        if (data.status === "PAID") {
          setIsPaid(true);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch { /* silent */ }
    }, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [orderId, isPaid, isCancelled]);

  // Load payment methods on mount (for sheet)
  useEffect(() => {
    setMethodsLoading(true);
    fetch("/api/checkout/payment-methods")
      .then((r) => r.json())
      .then((j) => { if (j.success) setPaymentMethods(j.data ?? []); })
      .catch(() => {})
      .finally(() => setMethodsLoading(false));
  }, []);

  // ─── actions ────────────────────────────────────────────────────────────────

  async function handleChangeMethod(newMethod: "VA" | "QRIS", bankCode?: string) {
    if (!orderId) return;
    setChangingMethod(true);
    try {
      const res = await fetch(`/api/payments/${orderId}/method`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: newMethod, bankCode }),
      });
      const json = await res.json();
      if (!res.ok) { toast(json.message ?? t("common.error"), { variant: "error" }); return; }
      const d = json.data ?? json;
      setPaymentMethod(d.method ?? newMethod);
      setPaymentUrl(d.paymentUrl ?? null);
      setVaNumber(d.vaNumber ?? null);
      setVaBank(d.vaBank ?? null);
      setExpiresAt(d.expiresAt ?? null);
      setFinalAmount(d.finalAmount ?? null);
      setSheetOpen(false);
    } catch {
      toast(t("common.error"), { variant: "error" });
    } finally {
      setChangingMethod(false);
    }
  }

  async function handleCancelOrder() {
    if (!orderId) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) { toast(json.message ?? t("common.error"), { variant: "error" }); return; }
      setIsCancelled(true);
      setCancelConfirmOpen(false);
    } catch {
      toast(t("common.error"), { variant: "error" });
    } finally {
      setCancelling(false);
    }
  }

  // ─── render helpers ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 space-y-4 md:max-w-3xl md:py-12">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-accent animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center space-y-4 md:max-w-3xl md:py-14">
        <p className="text-destructive">{error || t("trackOrder.notFound")}</p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold"
        >
          {t("checkout.backToHome")}
        </button>
      </div>
    );
  }

  const payment = order.payment;
  const address = order.shippingAddress as unknown as ShippingAddress;
  const isPending = !isPaid && !isCancelled && order.status === "PENDING";
  const isPaymentExpired = countdown.expired && isPending;
  const payableAmount = finalAmount != null ? finalAmount : (payment?.amount ?? order.total);
  const isQris = paymentMethod.toUpperCase() === "QRIS";

  // VA bank display
  const bankMethod = paymentMethods.find(
    (m) => m.paymentType === "va" && m.bankCode?.toUpperCase() === (vaBank ?? "").toUpperCase()
  );
  const bankLogoUrl = bankMethod?.logoUrl ?? null;
  const bankDisplayName = bankMethod?.displayName ?? vaBank ?? "";

  // Payment instructions
  const buildAccordion = (): AccordionItem[] => {
    if (isQris) {
      return [{
        id: "qris",
        label: t("payment.howToPayQRIS"),
        steps: [
          t("payment.qrisStep1"),
          t("payment.qrisStep2"),
          t("payment.qrisStep3"),
          t("payment.qrisStep4", { amount: formatPrice(payableAmount, "IDR", locale) }),
          t("payment.qrisStep5"),
        ],
      }];
    }
    const bank = bankDisplayName || t("payment.destination");
    return [
      {
        id: "atm",
        label: t("payment.atm"),
        steps: [
          t("payment.vaAtmStep1"),
          t("payment.vaAtmStep2"),
          t("payment.vaAtmStep3", { bank }),
          t("payment.vaAtmStep4", { vaNumber: vaNumber ?? "" }),
          t("payment.vaAtmStep5", { amount: formatPrice(payableAmount, "IDR", locale) }),
          t("payment.vaAtmStep6"),
        ],
      },
      {
        id: "mbanking",
        label: t("payment.mobileBanking"),
        steps: [
          t("payment.vaMbStep1"),
          t("payment.vaMbStep2"),
          t("payment.vaMbStep3", { vaNumber: vaNumber ?? "" }),
          t("payment.vaMbStep4", { amount: formatPrice(payableAmount, "IDR", locale) }),
          t("payment.vaMbStep5"),
        ],
      },
      {
        id: "ibanking",
        label: t("payment.internetBanking"),
        steps: [
          t("payment.vaIbStep1", { bank }),
          t("payment.vaIbStep2"),
          t("payment.vaIbStep3"),
          t("payment.vaIbStep4", { vaNumber: vaNumber ?? "" }),
          t("payment.vaIbStep5", { amount: formatPrice(payableAmount, "IDR", locale) }),
          t("payment.vaIbStep6"),
        ],
      },
    ];
  };

  // Status label
  const statusLabel = isPaid
    ? t("payment.paid")
    : isCancelled
      ? t("payment.statusCancelled")
      : isPaymentExpired
        ? t("payment.statusExpired")
        : t("payment.unpaid");

  const statusTextColor = isPaid
    ? "text-success"
    : isCancelled
      ? "text-muted"
      : isPaymentExpired
        ? "text-warning"
        : "text-orange-600";

  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "62895412144456";

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 space-y-4 md:max-w-3xl md:py-10">
      {/* ── 1. HERO ─────────────────────────────────────────────────── */}
      <section>
        <h1 className="sr-only">{t("payment.orderMyTitle")}</h1>

        {/* Order Saya */}
        <p className="text-xs text-muted font-medium">{t("payment.orderMyTitle")}</p>

        {/* Order ID */}
        <div className="py-2 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="text-xs text-muted shrink-0">ID</span>
            <p className="text-xl font-bold truncate">#{order.orderNumber}</p>
          </div>
          <CopyBtn text={order.orderNumber} label={t("payment.copyId")} iconOnly />
        </div>

        {/* Status */}
        <div className="py-2 flex items-center justify-between gap-3">
          <span className="text-sm text-muted">{t("payment.statusRow")}</span>
          <span className={`text-sm font-bold text-right ${statusTextColor}`}>
            {isPaid && (
              <svg
                className="inline-block w-3.5 h-3.5 mr-1 -mt-0.5 text-success"
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
              >
                <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {statusLabel}
          </span>
        </div>

        {/* Tanggal Pemesanan */}
        <div className="py-2 flex items-center justify-between gap-3">
          <span className="text-sm text-muted">{t("payment.orderDate")}</span>
          <span className="text-sm font-medium text-right">{formatShortDate(order.createdAt, locale)}</span>
        </div>

        {/* Total Pembayaran */}
        <div className="py-2 flex items-center justify-between gap-3">
          <span className="text-sm text-muted">{t("payment.totalPayment")}</span>
          <span className="inline-flex items-center gap-2 shrink-0">
            <span className="text-sm font-bold">{formatPrice(payableAmount, "IDR", locale)}</span>
            <CopyBtn text={String(payableAmount)} label={t("payment.copyAmount")} iconOnly />
          </span>
        </div>

        {/* Waktu yang tersisa — disembunyikan saat kadaluarsa (diganti tombol Buat Pembayaran Baru di bawah) */}
        {isPending && !isPaymentExpired && expiresAt && (
          <div className="py-2 flex items-start justify-between gap-3">
            <span className="text-sm text-muted pt-0.5">{t("payment.timeRemaining")}</span>
            <div className="text-right">
              <p className="text-2xl font-bold font-mono text-foreground tabular-nums leading-none">
                {countdown.formatted}
              </p>
              <p className="text-xs text-muted mt-1">
                {t("payment.validUntil")}{" "}
                <span className="font-medium text-foreground/80">
                  {formatShortDate(expiresAt, locale)}, {formatTime(expiresAt, locale)}
                </span>
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ── 2. PAYMENT CARD ──────────────────────────────────────────── */}
      {isPending && !isPaymentExpired && (
        <div className="border border-border rounded-xl overflow-hidden">
          {isQris && paymentUrl ? (
            /* QRIS */
            <div className="p-5 text-center space-y-4">
              <div className="flex items-center gap-2 justify-center">
                <span className="text-xs font-semibold tracking-widest uppercase text-muted">QRIS</span>
                <span className="text-xs text-muted">—</span>
                <span className="text-xs text-muted">{t("payment.qrisCode")}</span>
              </div>
              <div className="bg-white border border-border rounded-lg p-4 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={paymentUrl}
                  alt={t("payment.qrisAlt")}
                  className="w-48 h-48 object-contain mx-auto"
                />
              </div>
              <p className="text-xs text-muted">
                {t("payment.expiresIn")} <span className="font-semibold text-warning">{countdown.formatted}</span>
              </p>
            </div>
          ) : vaNumber ? (
            /* VA */
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                {bankLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={bankLogoUrl} alt={bankDisplayName} className="h-7 object-contain" />
                ) : (
                  <div className="w-10 h-7 bg-accent rounded flex items-center justify-center">
                    <span className="text-[9px] font-bold text-muted">{vaBank}</span>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted">{t("payment.toBank")}</p>
                  <p className="text-sm font-semibold">{bankDisplayName || vaBank}</p>
                  <p className="text-xs text-muted">Virtual Account</p>
                </div>
              </div>

              <div className="bg-accent rounded-lg p-4 space-y-1">
                <p className="text-xs text-muted">{t("payment.vaNumber")}</p>
                <div className="flex items-center gap-2 min-w-0">
                  <p className="flex-1 min-w-0 text-xl font-bold font-mono tracking-widest select-all truncate">{vaNumber}</p>
                  <button
                    type="button"
                    onClick={() => copyText(vaNumber, setVaCopied)}
                    aria-label={vaCopied ? t("payment.copied") : t("payment.copyVA")}
                    className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-primary text-primary hover:bg-primary/5 active:scale-95 transition-all"
                  >
                    {vaCopied ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <rect x="1" y="5" width="9" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                        <path d="M5 5V3.5A1.5 1.5 0 016.5 2H12.5A1.5 1.5 0 0114 3.5V9.5A1.5 1.5 0 0112.5 11H11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">{t("payment.accountName")}</span>
                <span className="font-medium">{order.guestName || order.shippingAddress && (order.shippingAddress as unknown as ShippingAddress).recipientName}</span>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ── 3. INFO BOX ──────────────────────────────────────────────── */}
      {isPending && !isPaymentExpired && (
        <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0 mt-0.5 text-blue-500">
            <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 8v5M9 6v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">{t("payment.infoFollow")}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">{t("payment.dontShare")}</p>
          </div>
        </div>
      )}

      {/* ── 4. PAYMENT INSTRUCTIONS ACCORDION ───────────────────────── */}
      {isPending && !isPaymentExpired && (vaNumber || (isQris && paymentUrl)) && (
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-widest uppercase text-muted px-1">
            {t("payment.paymentInstructions")}
          </p>
          <PaymentAccordion items={buildAccordion()} />
        </div>
      )}

      {/* ── 5. CHANGE PAYMENT METHOD / CREATE NEW PAYMENT ───────────── */}
      {isPending && (
        <div className="text-center">
          {isPaymentExpired ? (
            <button
              type="button"
              onClick={() => setExpiredSheetOpen(true)}
              className="text-sm text-destructive hover:underline font-medium"
            >
              {t("payment.orderAgainFromCart")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="text-sm text-primary hover:underline font-medium"
            >
              {t("payment.changeMethod")}
            </button>
          )}
        </div>
      )}

      {/* ── 6. ORDER SUMMARY ─────────────────────────────────────────── */}
      <div className="border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-semibold tracking-widest uppercase">{t("payment.orderSummaryTitle")}</h3>

        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-3">
              <div className="shrink-0 w-14 h-20 bg-accent rounded-lg overflow-hidden relative">
                {item.imageUrl && (
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="56px" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight line-clamp-2">{item.name}</p>
                <p className="text-xs text-muted mt-1">SKU: {item.sku}</p>
                <p className="text-xs text-muted">{t("trackOrder.qty")} {item.quantity}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold">{formatPrice(item.subtotal, "IDR", locale)}</p>
                <p className="text-xs text-muted">{formatPrice(item.price, "IDR", locale)}/item</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-3 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">{t("cart.subtotal")}</span>
            <span>{formatPrice(order.subtotal, "IDR", locale)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-success">
              <span>
                {order.couponCode
                  ? t("checkout.couponDiscount", { code: order.couponCode })
                  : t("checkout.discount")}
              </span>
              <span>−{formatPrice(order.discount, "IDR", locale)}</span>
            </div>
          )}
          <div className={`flex justify-between ${order.shippingCost === 0 ? "text-success" : ""}`}>
            <span className={order.shippingCost === 0 ? "" : "text-muted"}>
              {order.shippingCost === 0 && order.couponCode && order.discount === 0
                ? t("checkout.couponFreeShipping", { code: order.couponCode })
                : t("checkout.shipping")}
            </span>
            <span className={order.shippingCost === 0 ? "font-medium" : ""}>
              {order.shippingCost === 0
                ? t("checkout.freeShipping")
                : formatPrice(order.shippingCost, "IDR", locale)}
            </span>
          </div>
          {finalAmount != null && finalAmount > order.total && (
            <div className="flex justify-between text-muted">
              <span>{t("payment.feeIncluded", { fee: "" }).replace("{fee}", "")}</span>
              <span>+{formatPrice(finalAmount - order.total, "IDR", locale)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
            <span>{t("checkout.totalPayment")}</span>
            <span>{formatPrice(payableAmount, "IDR", locale)}</span>
          </div>
        </div>
      </div>

      {/* ── 7. ORDER DETAILS ─────────────────────────────────────────── */}
      <div className="border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold tracking-widest uppercase">{t("payment.orderDetailsTitle")}</h3>
          {isPending && (
            <button
              type="button"
              onClick={() => setEditInfoOpen(true)}
              className="text-xs text-primary hover:underline font-medium"
            >
              {t("payment.changeInfo")}
            </button>
          )}
        </div>

        <div className="space-y-3 text-sm">
          {(order.guestEmail || order.userEmail) && (
            <div className="flex justify-between gap-2">
              <span className="text-muted shrink-0">{t("payment.orderEmail")}</span>
              <span className="text-right truncate">{order.userEmail ?? order.guestEmail ?? "—"}</span>
            </div>
          )}

          {order.courier && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted font-medium uppercase tracking-wide">{t("payment.courierService")}</p>
              <div className="flex justify-between">
                <span className="text-muted">{t("trackOrder.courier")}</span>
                <span className="font-medium">{courierDisplayLabel(order.courier)}</span>
              </div>
              {order.courierService && (
                <div className="flex justify-between">
                  <span className="text-muted">{t("payment.service")}</span>
                  <span>{order.courierService}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <p className="text-xs text-muted font-medium uppercase tracking-wide">{t("payment.recipient")}</p>
            <p className="font-medium">{address.recipientName}</p>
            <p className="text-muted text-xs">{address.phone}</p>
            <p className="text-muted text-xs leading-relaxed">
              {address.street}, {address.district}, {address.city}, {address.province}{" "}
              {address.postalCode}
            </p>
          </div>

          {order.trackingNumber && (
            <div className="flex justify-between">
              <span className="text-muted">{t("trackOrder.receipt")}</span>
              <span className="font-mono font-semibold">{order.trackingNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── 8. FOOTER ACTIONS ────────────────────────────────────────── */}
      <div className="border border-border rounded-xl p-5 space-y-4">
        {/* WhatsApp help */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">{t("payment.needHelp")}</p>
          <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-success font-semibold hover:underline flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {t("payment.contactUs")}
          </a>
        </div>

        {/* Main CTA */}
        <div className="flex flex-col gap-2">
          <Link
            href="/shop"
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            {t("cart.continueShopping")}
          </Link>
          <Link
            href="/"
            className="w-full h-11 rounded-xl border border-border text-sm font-medium flex items-center justify-center hover:bg-accent transition-colors"
          >
            {t("checkout.backToHome")}
          </Link>
        </div>

        {/* Cancel */}
        {isPending && !isCancelled && (
          <div className="text-center">
            {cancelConfirmOpen ? (
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 space-y-2">
                <p className="text-xs text-destructive">{t("payment.cancelConfirm")}</p>
                <div className="flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => setCancelConfirmOpen(false)}
                    className="text-xs px-3 py-1.5 border border-border rounded-md hover:bg-accent transition-colors"
                  >
                    {t("common.back")}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    className="text-xs px-3 py-1.5 bg-destructive text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {cancelling ? t("payment.cancelling") : t("payment.cancelOrder")}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCancelConfirmOpen(true)}
                className="text-xs text-destructive hover:underline"
              >
                {t("payment.cancelOrder")}
              </button>
            )}
          </div>
        )}

        {isCancelled && (
          <p className="text-xs text-muted text-center">{t("payment.cancelSuccess")}</p>
        )}

        {/* T&C */}
        <p className="text-center">
          <Link href="/terms" className="text-xs text-muted hover:underline">
            {t("payment.termConditions")}
          </Link>
        </p>
      </div>

      {/* ── Payment method sheet ──────────────────────────────────────── */}
      <PaymentMethodSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        methods={paymentMethods}
        loading={methodsLoading}
        onConfirm={handleChangeMethod}
        confirming={changingMethod}
      />

      {/* ── Expired alert sheet (→ keranjang) ─────────────────────────── */}
      <ExpiredSheet
        open={expiredSheetOpen}
        onClose={() => setExpiredSheetOpen(false)}
        reordering={reordering}
        onContinue={async () => {
          if (!orderId || reordering) return;
          setReordering(true);
          try {
            const res = await fetch(`/api/orders/${orderId}/reorder`, { method: "POST" });
            const json = await res.json();
            if (!res.ok) {
              toast(json.message ?? t("common.error"), { variant: "error" });
              setReordering(false);
              return;
            }
            const data = json.data ?? json;
            const reorderItems = (data.items ?? []) as Array<Parameters<typeof addItem>[0]>;
            reorderItems.forEach((item) => addItem(item));
            setExpiredSheetOpen(false);
            router.push("/cart");
          } catch {
            toast(t("common.error"), { variant: "error" });
            setReordering(false);
          }
        }}
        t={t}
      />

      {/* ── Edit info sheet ───────────────────────────────────────────── */}
      <EditInfoSheet
        open={editInfoOpen}
        onClose={() => setEditInfoOpen(false)}
        orderId={order.id}
        isGuest={!order.userId}
        initialCourier={order.courier ?? ""}
        initialCourierService={order.courierService ?? ""}
        initialValues={{
          email: order.userId ? (order.userEmail ?? "") : (order.guestEmail ?? ""),
          guestName: order.guestName ?? "",
          guestPhone: order.guestPhone ?? "",
          recipientName: address.recipientName,
          phone: address.phone,
          street: address.street,
          district: address.district,
          city: address.city,
          province: address.province,
          postalCode: address.postalCode,
        }}
        onSaved={(values) => {
          setOrder((prev) =>
            prev
              ? {
                  ...prev,
                  guestName: values.guestName || prev.guestName,
                  guestEmail: values.email || prev.guestEmail,
                  guestPhone: values.guestPhone || prev.guestPhone,
                  courier: values.courier ?? prev.courier,
                  courierService: values.courierService ?? prev.courierService,
                  shippingCost: values.shippingCost ?? prev.shippingCost,
                  total: values.total ?? prev.total,
                  shippingAddress: {
                    recipientName: values.recipientName,
                    phone: values.phone,
                    street: values.street,
                    district: values.district,
                    city: values.city,
                    province: values.province,
                    postalCode: values.postalCode,
                  },
                }
              : prev
          );
          // If courier changed → new payment data
          if (values.paymentUrl !== undefined || values.vaNumber !== undefined) {
            if (values.paymentUrl !== undefined) setPaymentUrl(values.paymentUrl);
            if (values.vaNumber !== undefined) setVaNumber(values.vaNumber);
            if (values.vaBank !== undefined) setVaBank(values.vaBank ?? null);
            if (values.expiresAt !== undefined) setExpiresAt(values.expiresAt ?? null);
            if (values.finalAmount !== undefined) setFinalAmount(values.finalAmount ?? null);
          }
        }}
      />
    </div>
  );
}
