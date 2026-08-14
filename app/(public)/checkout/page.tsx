"use client";

import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/stores/cart-store";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n/client";
import { useStoreSettings } from "@/components/providers/store-settings-provider";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { LocationSearch } from "@/components/checkout/location-search";
import { cn, formatPrice } from "@/lib/utils";
import { courierDisplayLabel } from "@/lib/rajaongkir-constants";
import type { CourierCost, KomercePaymentMethod, ShippingConfig, V2Destination } from "@/types";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface SavedAddress {
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

interface SelectedCourier {
  name: string;
  service: string;
  cost: number;
  etd: string;
}

interface AppliedCoupon {
  code: string;
  type: string;
  discount: number;
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const { status, data: session } = useSession();
  const { toast } = useToast();
  const { t, locale } = useI18n();
  const { freeShippingThreshold } = useStoreSettings();
  const { items, totalPrice, totalWeight, clearCart } = useCartStore();

  // ── Data ──
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null);
  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });

  // ── Dropship ──
  const [dropship, setDropship] = useState(false);
  const [dropshipName, setDropshipName] = useState("");
  const [dropshipPhone, setDropshipPhone] = useState("");

  // ── Shipping ──
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig | null>(null);
  const [courierCosts, setCourierCosts] = useState<CourierCost[]>([]);
  const [costLoading, setCostLoading] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState<SelectedCourier | null>(null);

  // ── Payment ──
  const [paymentMethods, setPaymentMethods] = useState<KomercePaymentMethod[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<KomercePaymentMethod | null>(null);

  // ── Notes ──
  const [noteOption, setNoteOption] = useState<"front" | "lobby" | "custom" | "">("");
  const [customNote, setCustomNote] = useState("");

  // ── Voucher ──
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);

  // ── Sheet open/close ──
  const [addressSheetOpen, setAddressSheetOpen] = useState(false);
  const [shippingSheetOpen, setShippingSheetOpen] = useState(false);
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const [notesSheetOpen, setNotesSheetOpen] = useState(false);
  const [voucherSheetOpen, setVoucherSheetOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [placing, setPlacing] = useState<"idle" | "processing" | "success">("idle");

  // ── Computed ──
  const subtotal = totalPrice();
  const weight = totalWeight();
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const isFreeShippingByThreshold = subtotal >= freeShippingThreshold;
  const isFreeShippingByCoupon = coupon?.type === "FREE_SHIPPING";
  const isFreeShipping = isFreeShippingByThreshold || isFreeShippingByCoupon;
  const shippingCost = isFreeShipping ? 0 : (selectedCourier?.cost ?? 0);
  const discount = coupon?.discount ?? 0;
  const grandTotal = subtotal - discount + shippingCost;

  const effectiveNote =
    noteOption === "front" ? t("checkout.leaveAtFront")
    : noteOption === "lobby" ? t("checkout.leaveAtLobby")
    : noteOption === "custom" ? customNote
    : "";

  // ── Fetch on auth ──
  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;

    async function load() {
      try {
        const [profRes, addrRes, cfgRes] = await Promise.all([
          fetch("/api/account/profile"),
          fetch("/api/account/addresses"),
          fetch("/api/shipping/config"),
        ]);
        if (cancelled) return;

        const prof = (await profRes.json().catch(() => ({})))?.data ?? {};
        setProfile({
          name: [prof.firstName, prof.lastName].filter(Boolean).join(" ") || session?.user?.name || "",
          email: session?.user?.email || "",
          phone: prof.phone || "",
        });

        const addrs = ((await addrRes.json().catch(() => ({})))?.data ?? []) as SavedAddress[];
        if (cancelled) return;
        setAddresses(addrs);
        const def = addrs.find((a) => a.isDefault) ?? addrs[0] ?? null;
        setSelectedAddress(def);

        const cfgJson = await cfgRes.json().catch(() => ({}));
        if (!cancelled && cfgJson.success) setShippingConfig(cfgJson.data ?? null);
      } catch { /* silent */ }
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // ── Load payment methods ──
  useEffect(() => {
    setPaymentLoading(true);
    fetch("/api/checkout/payment-methods")
      .then((r) => r.json())
      .then((json) => { if (json.success) setPaymentMethods(json.data ?? []); })
      .catch(() => {})
      .finally(() => setPaymentLoading(false));
  }, []);

  // ── Load shipping costs when address or weight changes ──
  useEffect(() => {
    const destId = selectedAddress?.locationId;
    if (!shippingConfig?.configured || !shippingConfig.originCityId || !destId) {
      setCourierCosts([]);
      return;
    }
    let cancelled = false;
    setCostLoading(true);
    setSelectedCourier(null);

    fetch("/api/shipping/cost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: shippingConfig.originCityId,
        destination: destId,
        weight: Math.max(weight, 250),
        couriers: shippingConfig.couriers,
      }),
    })
      .then((r) => r.json())
      .then((json) => { if (!cancelled) setCourierCosts(json.data?.costs ?? []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setCostLoading(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddress?.locationId, shippingConfig, weight]);

  // ── Redirect if empty cart ──
  useEffect(() => {
    if (!submitting && items.length === 0) router.replace("/cart");
  }, [items.length, submitting, router]);

  // ── Auth guard ──
  useEffect(() => {
    if (status === "unauthenticated") router.push("/account");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // ── Lock scroll during preload overlay ──
  useEffect(() => {
    if (placing === "idle") return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [placing]);

  const handlePlaceOrder = useCallback(async () => {
    if (!selectedAddress) {
      toast(t("checkout.chooseAddressFirst"), { variant: "warning" });
      return;
    }
    if (!selectedAddress.locationId) {
      toast(t("checkout.addressNeedsLocation"), { variant: "warning" });
      return;
    }
    if (!selectedCourier) {
      toast(t("checkout.chooseShippingFirst"), { variant: "warning" });
      return;
    }
    if (!selectedPayment) {
      toast(t("checkout.choosePaymentFirst"), { variant: "warning" });
      return;
    }

    const customerPhone = profile.phone || selectedAddress.phone;
    if (!customerPhone || !/^(\+62|62|0)[0-9]{8,13}$/.test(customerPhone)) {
      toast(t("checkout.invalidPhone"), { variant: "warning" });
      return;
    }

    const notesStr = dropship
      ? `[DROPSHIP: ${dropshipName} | ${dropshipPhone}]${effectiveNote ? " " + effectiveNote : ""}`
      : effectiveNote || undefined;

    const startedAt = Date.now();
    setSubmitting(true);
    setPlacing("processing");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: profile.name || selectedAddress.recipientName,
            email: profile.email,
            phone: customerPhone,
          },
          address: {
            recipientName: selectedAddress.recipientName,
            phone: selectedAddress.phone,
            street: selectedAddress.street,
            district: selectedAddress.district,
            city: selectedAddress.city,
            province: selectedAddress.province,
            postalCode: selectedAddress.postalCode,
            locationId: selectedAddress.locationId,
            locationLabel: selectedAddress.locationLabel ?? "",
          },
          items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
          couponCode: coupon?.code,
          courier: {
            name: selectedCourier.name,
            service: selectedCourier.service,
            cost: isFreeShipping ? 0 : selectedCourier.cost,
          },
          paymentMethod: selectedPayment.paymentType.toUpperCase() as "VA" | "QRIS" | "EWALLET",
          paymentBank: selectedPayment.paymentType === "va" ? selectedPayment.bankCode : undefined,
          notes: notesStr,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.message ?? t("validation.createOrderError"), { variant: "error" });
        setSubmitting(false);
        setPlacing("idle");
        return;
      }
      const order = json.data ?? json;
      // Preload overlay: pastikan spinner terlihat cukup lama, lalu checkmark singkat sebelum pindah halaman
      const MIN_SPINNER_MS = 900;
      const SUCCESS_HOLD_MS = 600;
      const wait = Math.max(0, MIN_SPINNER_MS - (Date.now() - startedAt));
      setPlacing("success");
      window.setTimeout(() => {
        clearCart();
        router.push(`/checkout/success?orderId=${order.orderId}&orderNumber=${order.orderNumber}`);
      }, wait + SUCCESS_HOLD_MS);
    } catch {
      toast(t("toast.errorOccurred"), { variant: "error" });
      setSubmitting(false);
      setPlacing("idle");
    }
  }, [
    selectedAddress, selectedCourier, selectedPayment, profile, coupon,
    items, isFreeShipping, dropship, dropshipName, dropshipPhone, effectiveNote,
    clearCart, router, toast, t,
  ]);

  if (items.length === 0) return null;

  const canOrder = Boolean(selectedAddress?.locationId && selectedCourier && selectedPayment);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
      <Breadcrumb
        items={[{ label: t("nav.home"), href: "/" }, { label: t("cart.title"), href: "/cart" }, { label: t("checkout.title") }]}
        className="mb-4"
      />
      <h1 className="text-xl font-bold mb-6">{t("checkout.title")}</h1>

      <div className="flex flex-col lg:flex-row gap-5 lg:gap-8 items-start">

        {/* ── Left column ── */}
        <div className="w-full lg:flex-1 space-y-4">

          {/* 1. Detail Alamat */}
          <section className="bg-white border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">{t("checkout.addressDetails")}</h2>
              <button
                type="button"
                onClick={() => setAddressSheetOpen(true)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {t("checkout.changeAddress")}
              </button>
            </div>

            {selectedAddress ? (
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">{selectedAddress.recipientName} · {selectedAddress.phone}</p>
                <p className="text-xs text-muted leading-relaxed">
                  {selectedAddress.street}, {selectedAddress.district}, {selectedAddress.city}, {selectedAddress.province} {selectedAddress.postalCode}
                </p>
                {selectedAddress.label && (
                  <span className="inline-block text-[10px] font-medium bg-accent text-muted px-2 py-0.5 rounded-full mt-1">
                    {selectedAddress.label}
                  </span>
                )}
                {!selectedAddress.locationId && (
                  <p className="text-[11px] text-orange-500 font-medium mt-1">
                    ⚠ {t("checkout.missingLocation")} — ubah alamat untuk menambah wilayah
                  </p>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddressSheetOpen(true)}
                className="w-full py-4 border-2 border-dashed border-border rounded-lg text-sm text-muted hover:border-primary hover:text-primary transition-colors text-center"
              >
                {t("checkout.addAddressFirst")}
              </button>
            )}

            {/* Dropship checkbox */}
            <label className="flex items-center gap-2.5 mt-4 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dropship}
                onChange={(e) => setDropship(e.target.checked)}
                className="w-4 h-4 rounded border-border accent-primary"
              />
              <span className="text-xs text-foreground/80">{t("checkout.dropship")}</span>
            </label>

            {dropship && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder={t("checkout.dropshipSenderName")}
                  value={dropshipName}
                  onChange={(e) => setDropshipName(e.target.value)}
                  className="h-9 px-3 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  type="tel"
                  placeholder={t("checkout.dropshipSenderPhone")}
                  value={dropshipPhone}
                  onChange={(e) => setDropshipPhone(e.target.value)}
                  className="h-9 px-3 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}
          </section>

          {/* 2. Metode Pengiriman */}
          <button
            type="button"
            onClick={() => {
              if (!selectedAddress?.locationId) {
                toast(t("checkout.addressLocationRequired"), { variant: "warning" });
                return;
              }
              setShippingSheetOpen(true);
            }}
            className="w-full bg-white border border-border rounded-xl p-4 text-left hover:border-primary/50 transition-colors"
          >
            <p className="text-xs text-muted mb-1.5 font-medium uppercase tracking-wider">{t("checkout.shippingMethodCard")}</p>
            {selectedCourier ? (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{courierDisplayLabel(selectedCourier.name)} — {selectedCourier.service}</p>
                  <p className="text-xs text-muted">{t("checkout.shippingEstimate", { etd: selectedCourier.etd })}</p>
                </div>
                {isFreeShipping ? (
                  <span className="text-sm font-bold text-success shrink-0">{t("checkout.freeShipping")}</span>
                ) : (
                  <span className="text-sm font-bold text-primary shrink-0">{formatPrice(selectedCourier.cost, "IDR", locale)}</span>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted">{t("checkout.selectShipping")}</p>
                <ChevronRightIcon />
              </div>
            )}
          </button>

          {/* 3. Metode Pembayaran */}
          <button
            type="button"
            onClick={() => setPaymentSheetOpen(true)}
            className="w-full bg-white border border-border rounded-xl p-4 text-left hover:border-primary/50 transition-colors"
          >
            <p className="text-xs text-muted mb-1.5 font-medium uppercase tracking-wider">{t("checkout.paymentMethodCard")}</p>
            {selectedPayment ? (
              <div className="flex items-center gap-3">
                {selectedPayment.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedPayment.logoUrl} alt={selectedPayment.displayName} className="w-10 h-7 object-contain shrink-0" />
                )}
                <p className="text-sm font-semibold">{selectedPayment.displayName}</p>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted">{t("checkout.selectPayment")}</p>
                <ChevronRightIcon />
              </div>
            )}
          </button>

        </div>

        {/* ── Right column ── */}
        <aside className="w-full lg:w-80 xl:w-96 shrink-0 lg:sticky space-y-4" style={{ top: 80 }}>

          {/* 5. Ringkasan Pesanan */}
          <div className="bg-white border border-border rounded-xl p-4 space-y-4">
            <h2 className="text-lg font-bold">{t("checkout.orderSummary")}</h2>

            {/* Product list */}
            <div className="space-y-3 max-h-52 overflow-y-auto">
              {items.map((item) => (
                <div key={`${item.productId}-${item.variantId}`} className="flex gap-3 items-start">
                  <div className="shrink-0 w-12 h-16 bg-accent rounded-lg overflow-hidden relative">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="48px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-muted">IMG</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium leading-snug line-clamp-2">{item.name}</p>
                    {item.variantName && <p className="text-[11px] text-muted mt-1">{item.variantName}</p>}
                    <p className="text-[11px] text-muted mt-0.5">{t("checkout.itemQty", { count: item.quantity })}</p>
                  </div>
                  <p className="text-xs font-semibold shrink-0 text-right">{formatPrice(item.price * item.quantity, "IDR", locale)}</p>
                </div>
              ))}
            </div>

            {/* Pesan pengiriman */}
            <button
              type="button"
              onClick={() => setNotesSheetOpen(true)}
              className="w-full flex items-center gap-2.5 border border-border rounded-lg px-3.5 py-3 text-left hover:border-primary/50 transition-colors"
            >
              <span aria-hidden="true" className="shrink-0">📝</span>
              <span className={cn("flex-1 min-w-0 text-sm truncate", effectiveNote ? "text-foreground/80" : "text-muted")}>
                {effectiveNote || t("checkout.summaryDeliveryNote")}
              </span>
              <ChevronRightIcon />
            </button>

            {/* Voucher */}
            {coupon ? (
              <button
                type="button"
                onClick={() => setVoucherSheetOpen(true)}
                className="w-full flex items-center gap-2.5 border border-border rounded-lg px-3.5 py-3 text-left hover:border-primary/50 transition-colors"
              >
                <span aria-hidden="true" className="shrink-0">🏷</span>
                <span className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full shrink-0">{coupon.code}</span>
                  {coupon.type !== "FREE_SHIPPING" && discount > 0 && (
                    <span className="text-xs text-success truncate">−{formatPrice(discount, "IDR", locale)}</span>
                  )}
                  {coupon.type === "FREE_SHIPPING" && (
                    <span className="text-xs text-success truncate">Gratis Ongkir</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setCoupon(null); }}
                  className="text-xs text-muted hover:text-destructive shrink-0"
                >
                  {t("checkout.removeVoucher")}
                </button>
                <ChevronRightIcon />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setVoucherSheetOpen(true)}
                className="w-full flex items-center gap-2.5 border border-border rounded-lg px-3.5 py-3 text-left hover:border-primary/50 transition-colors"
              >
                <span aria-hidden="true" className="shrink-0">🏷</span>
                <span className="flex-1 min-w-0 text-sm text-muted truncate">{t("checkout.summaryVoucher")}</span>
                <ChevronRightIcon />
              </button>
            )}

            {/* Price breakdown */}
            <div className="space-y-2 border-t border-border pt-3">
              <SummaryRow label={t("checkout.subtotalItems", { count: itemCount })} value={formatPrice(subtotal, "IDR", locale)} />
              {coupon && coupon.type !== "FREE_SHIPPING" && discount > 0 && (
                <SummaryRow label={t("checkout.couponDiscount", { code: coupon.code })} value={`−${formatPrice(discount, "IDR", locale)}`} className="text-success" />
              )}
              <SummaryRow
                label={
                  isFreeShipping && coupon?.type === "FREE_SHIPPING"
                    ? t("checkout.couponFreeShipping", { code: coupon!.code })
                    : t("checkout.shippingWithWeight", { weight })
                }
                value={
                  isFreeShipping ? t("checkout.freeShipping")
                  : selectedCourier ? formatPrice(shippingCost, "IDR", locale)
                  : "—"
                }
                className={isFreeShipping ? "text-success" : ""}
              />
              <div className="border-t border-border pt-3 flex justify-between items-baseline">
                <span className="text-sm font-bold">{t("checkout.totalPayment")}</span>
                <span className="text-base font-extrabold text-primary">{formatPrice(grandTotal, "IDR", locale)}</span>
              </div>
            </div>

            {/* Security */}
            <p className="flex items-center justify-center gap-1 text-center text-[11px] text-muted">
              <span aria-hidden="true">🔒</span>
              <span>{t("checkout.transactionSecure")} | {t("checkout.transactionEncrypted")}</span>
            </p>

            {/* Place order */}
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={submitting || !canOrder}
              className={cn(
                "w-full h-12 rounded-full text-sm font-bold transition-colors",
                canOrder && !submitting
                  ? "bg-primary text-white hover:bg-primary/90"
                  : "bg-muted/30 text-muted cursor-not-allowed"
              )}
            >
              {submitting ? t("checkout.processing") : t("checkout.placeOrder")}
            </button>

            {/* Terms */}
            <p className="text-center text-[11px] text-muted leading-relaxed">
              {t("checkout.termsAgree")}{" "}
              <Link href="/terms-conditions" className="font-medium underline underline-offset-2 hover:text-primary transition-colors">
                {t("payment.termConditions")}
              </Link>
            </p>
          </div>
        </aside>
      </div>

      {/* ── Preload overlay (klik Order Sekarang) ── */}
      {placing !== "idle" && (
        <div
          className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-white/95 backdrop-blur-md animate-[preload-fade_0.4s_ease-out]"
          role="status"
          aria-live="polite"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-muted mb-9">HAGE CLUB</p>
          {placing === "processing" ? <PreloadSpinner /> : <PreloadCheck />}
          <p className="mt-9 text-sm font-semibold text-foreground">
            {placing === "processing" ? t("checkout.placeOrderProcessing") : t("checkout.placeOrderSuccess")}
          </p>
          <p className="mt-1.5 text-xs text-muted">
            {placing === "processing" ? (
              <>
                {t("checkout.placeOrderSecure")}{" "}
                <span className="inline-flex items-center gap-1 align-middle">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1 h-1 rounded-full bg-primary animate-pulse"
                      style={{ animationDelay: `${i * 160}ms` }}
                    />
                  ))}
                </span>
              </>
            ) : (
              t("checkout.placeOrderRedirecting")
            )}
          </p>
        </div>
      )}

      {/* ── Bottom Sheets ── */}
      <AddressSheet
        isOpen={addressSheetOpen}
        onClose={() => setAddressSheetOpen(false)}
        addresses={addresses}
        selected={selectedAddress}
        onConfirm={(addr) => {
          setSelectedAddress(addr);
          setAddressSheetOpen(false);
          fetch("/api/account/addresses")
            .then((r) => r.json())
            .then((json) => { if (json.success) setAddresses(json.data ?? []); })
            .catch(() => {});
        }}
        t={t}
      />

      <ShippingSheet
        isOpen={shippingSheetOpen}
        onClose={() => setShippingSheetOpen(false)}
        courierCosts={courierCosts}
        loading={costLoading}
        config={shippingConfig}
        selected={selectedCourier}
        freeShipping={isFreeShipping}
        onConfirm={(c) => { setSelectedCourier(c); setShippingSheetOpen(false); }}
        t={t}
        locale={locale}
      />

      <PaymentSheet
        isOpen={paymentSheetOpen}
        onClose={() => setPaymentSheetOpen(false)}
        methods={paymentMethods}
        loading={paymentLoading}
        selected={selectedPayment}
        onConfirm={(m) => { setSelectedPayment(m); setPaymentSheetOpen(false); }}
        t={t}
      />

      <NotesSheet
        isOpen={notesSheetOpen}
        onClose={() => setNotesSheetOpen(false)}
        noteOption={noteOption}
        customNote={customNote}
        onConfirm={(opt, note) => { setNoteOption(opt); setCustomNote(note); setNotesSheetOpen(false); }}
        t={t}
      />

      <VoucherSheet
        isOpen={voucherSheetOpen}
        onClose={() => setVoucherSheetOpen(false)}
        appliedCoupon={coupon}
        subtotal={subtotal}
        city={selectedAddress?.city ?? ""}
        province={selectedAddress?.province ?? ""}
        productIds={items.map((i) => i.productId)}
        onApply={(c) => { setCoupon(c); setVoucherSheetOpen(false); }}
        t={t}
        locale={locale}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// Shared utility components
// ─────────────────────────────────────────────

function SummaryRow({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex justify-between items-baseline gap-2">
      <span className="text-sm text-muted">{label}</span>
      <span className={cn("text-sm text-right shrink-0", className)}>{value}</span>
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" className="shrink-0 text-muted" aria-hidden="true">
      <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PreloadSpinner() {
  return (
    <div className="relative w-20 h-20 text-primary" aria-hidden="true">
      <svg className="w-full h-full animate-spin" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="34" stroke="currentColor" strokeOpacity="0.12" strokeWidth="3.5" />
        <path d="M40 6a34 34 0 0 1 30.6 17.7" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
      <svg className="absolute inset-0 w-full h-full animate-spin [animation-direction:reverse] [animation-duration:1.4s]" viewBox="0 0 80 80" fill="none">
        <path d="M40 74a34 34 0 0 1-30.6-17.7" stroke="currentColor" strokeOpacity="0.4" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function PreloadCheck() {
  return (
    <div className="relative w-20 h-20 text-success animate-[preload-pop_0.35s_ease-out]" aria-hidden="true">
      <svg className="w-full h-full" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="34" stroke="currentColor" strokeOpacity="0.15" strokeWidth="3.5" />
        <path
          d="M24 41l10 10 22-22"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="[stroke-dasharray:48] [stroke-dashoffset:48] animate-[preload-check_0.45s_ease-out_forwards]"
        />
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────
// BottomSheet — reusable portal component
// ─────────────────────────────────────────────

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  fullScreen?: boolean;
  footer?: React.ReactNode;
}

function BottomSheet({ isOpen, onClose, title, children, fullScreen = false, footer }: BottomSheetProps) {
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

  if (!mounted) return null;

  return createPortal(
    <>
      <div
        className={cn("fixed inset-0 z-[70] bg-black/60 transition-opacity duration-300", isOpen ? "opacity-100" : "opacity-0 pointer-events-none")}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-2xl shadow-2xl flex flex-col sheet-transition",
          fullScreen ? "max-h-[95dvh]" : "max-h-[80dvh]",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <h2 className="text-base font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-muted hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Tutup"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
        {footer && (
          <div className="shrink-0 p-4 border-t border-border bg-white pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </>,
    document.body
  );
}

// ─────────────────────────────────────────────
// Address Sheet
// ─────────────────────────────────────────────

interface AddressSheetProps {
  isOpen: boolean;
  onClose: () => void;
  addresses: SavedAddress[];
  selected: SavedAddress | null;
  onConfirm: (addr: SavedAddress) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

function AddressSheet({ isOpen, onClose, addresses, selected, onConfirm, t }: AddressSheetProps) {
  const [view, setView] = useState<"list" | "add">("list");
  const [tempSelected, setTempSelected] = useState<SavedAddress | null>(selected);
  const [saving, setSaving] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newRecipient, setNewRecipient] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newStreet, setNewStreet] = useState("");
  const [newPostal, setNewPostal] = useState("");
  const [newLocation, setNewLocation] = useState<V2Destination | null>(null);
  const [newError, setNewError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setView("list");
      setTempSelected(selected);
      setNewLabel(""); setNewRecipient(""); setNewPhone("");
      setNewStreet(""); setNewPostal(""); setNewLocation(null); setNewError("");
    }
  }, [isOpen, selected]);

  async function handleSaveNew() {
    if (!newRecipient.trim() || !newPhone.trim() || !newStreet.trim() || !newLocation) {
      setNewError("Lengkapi semua field yang wajib diisi");
      return;
    }
    setNewError("");
    setSaving(true);
    try {
      const body = {
        label: newLabel.trim() || "Alamat Baru",
        recipientName: newRecipient.trim(),
        phone: newPhone.trim(),
        street: newStreet.trim(),
        district: [newLocation.district_name, newLocation.subdistrict_name].filter(Boolean).join(" / "),
        city: newLocation.city_name,
        province: newLocation.province_name,
        postalCode: (newPostal.trim() || newLocation.zip_code).slice(0, 5),
        locationId: String(newLocation.id),
        locationLabel: newLocation.label,
        isDefault: addresses.length === 0,
      };
      const res = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        onConfirm(json.data as SavedAddress);
      } else {
        setNewError(json.message ?? "Gagal menyimpan alamat");
      }
    } catch {
      setNewError("Gagal menyimpan alamat");
    } finally {
      setSaving(false);
    }
  }

  const footer =
    view === "list" ? (
      <button
        type="button"
        disabled={!tempSelected}
        onClick={() => tempSelected && onConfirm(tempSelected)}
        className={cn(
          "w-full h-12 rounded-full text-sm font-bold transition-colors",
          tempSelected ? "bg-primary text-white hover:bg-primary/90" : "bg-muted/30 text-muted cursor-not-allowed"
        )}
      >
        {t("checkout.confirm")}
      </button>
    ) : (
      <button
        type="button"
        disabled={saving}
        onClick={handleSaveNew}
        className="w-full h-12 rounded-full text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {saving ? "Menyimpan..." : "Simpan & Pilih"}
      </button>
    );

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t("checkout.selectAddressSheet")} footer={footer}>
      {view === "list" ? (
        <div className="p-4 space-y-3">
          {addresses.length === 0 ? (
            <div className="py-8 text-center space-y-1.5">
              <p className="text-sm font-semibold">{t("checkout.noAddressSaved")}</p>
              <p className="text-xs text-muted">{t("checkout.addAddressFirst")}</p>
            </div>
          ) : (
            addresses.map((addr) => (
              <button
                key={addr.id}
                type="button"
                onClick={() => setTempSelected(addr)}
                className={cn(
                  "w-full text-left p-3.5 rounded-xl border transition-colors",
                  tempSelected?.id === addr.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center", tempSelected?.id === addr.id ? "border-primary" : "border-muted")}>
                    {tempSelected?.id === addr.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold">{addr.recipientName}</p>
                      {addr.label && (
                        <span className="text-[10px] font-medium bg-accent text-muted px-1.5 py-0.5 rounded-full">{addr.label}</span>
                      )}
                      {addr.isDefault && (
                        <span className="text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Utama</span>
                      )}
                    </div>
                    <p className="text-xs text-muted mt-0.5">{addr.phone}</p>
                    <p className="text-xs text-muted leading-relaxed mt-0.5">
                      {addr.street}, {addr.district}, {addr.city}, {addr.province} {addr.postalCode}
                    </p>
                    {!addr.locationId && (
                      <p className="text-[11px] text-orange-500 mt-1">⚠ {t("checkout.missingLocation")}</p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}

          <button
            type="button"
            onClick={() => setView("add")}
            className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm text-muted hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
              <path d="M8 3v10M3 8h10" strokeLinecap="round" />
            </svg>
            {t("checkout.addNewAddress")}
          </button>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          <button
            type="button"
            onClick={() => setView("list")}
            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M10 4l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t("checkout.backToAddressList")}
          </button>

          {newError && <p className="text-xs text-destructive">{newError}</p>}

          <input
            type="text"
            placeholder={t("checkout.addressLabelPlaceholder")}
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="w-full h-10 px-3 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            type="text"
            placeholder={t("checkout.recipientName") + " *"}
            value={newRecipient}
            onChange={(e) => setNewRecipient(e.target.value)}
            className="w-full h-10 px-3 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            type="tel"
            placeholder={t("checkout.recipientPhone") + " *"}
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            className="w-full h-10 px-3 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
          />

          <LocationSearch
            selected={newLocation ? { id: String(newLocation.id), label: newLocation.label } : null}
            onSelect={(loc) => {
              setNewLocation(loc);
              if (!newPostal) setNewPostal(loc.zip_code);
            }}
            onClear={() => setNewLocation(null)}
            listClassName="max-h-40"
          />

          <textarea
            placeholder={t("checkout.fullAddressPlaceholder") + " *"}
            value={newStreet}
            onChange={(e) => setNewStreet(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
          <input
            type="text"
            placeholder={t("checkout.postalCode") + " *"}
            value={newPostal}
            onChange={(e) => setNewPostal(e.target.value)}
            maxLength={5}
            className="w-full h-10 px-3 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )}
    </BottomSheet>
  );
}

// ─────────────────────────────────────────────
// Shipping Sheet
// ─────────────────────────────────────────────

function parseMinDays(etd: string): number {
  const m = etd.replace(/[^0-9]/g, " ").trim().match(/^\d+/);
  return m ? parseInt(m[0]) : 999;
}

interface ShippingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  courierCosts: CourierCost[];
  loading: boolean;
  config: ShippingConfig | null;
  selected: SelectedCourier | null;
  freeShipping: boolean;
  onConfirm: (c: SelectedCourier) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: string;
}

function ShippingSheet({ isOpen, onClose, courierCosts, loading, config, selected, freeShipping, onConfirm, t, locale }: ShippingSheetProps) {
  const [tempSelected, setTempSelected] = useState<SelectedCourier | null>(selected);

  useEffect(() => {
    if (isOpen) setTempSelected(selected);
  }, [isOpen, selected]);

  // Ordered by admin config, max 3 cheapest per carrier
  const orderedGroups = (config?.couriers ?? [])
    .map((code) => {
      const found = courierCosts.find((c) => c.courier.toLowerCase() === code.toLowerCase());
      if (!found || found.services.length === 0) return null;
      const sorted = [...found.services].sort((a, b) => a.cost - b.cost);
      return { courier: code, label: courierDisplayLabel(code), services: sorted.slice(0, 3) };
    })
    .filter(Boolean) as Array<{ courier: string; label: string; services: CourierCost["services"] }>;

  // Badge logic
  const allServices = orderedGroups.flatMap((g) => g.services.map((s) => ({ ...s, courier: g.courier })));
  const minCost = allServices.length ? Math.min(...allServices.map((s) => s.cost)) : Infinity;
  const minDays = allServices.length ? Math.min(...allServices.map((s) => parseMinDays(s.etd))) : Infinity;
  let firstRecommendationUsed = false;

  const footer = (
    <button
      type="button"
      disabled={!tempSelected}
      onClick={() => tempSelected && onConfirm(tempSelected)}
      className={cn(
        "w-full h-12 rounded-full text-sm font-bold transition-colors",
        tempSelected ? "bg-primary text-white hover:bg-primary/90" : "bg-muted/30 text-muted cursor-not-allowed"
      )}
    >
      {t("checkout.confirm")}
    </button>
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t("checkout.shippingMethodCard")} footer={footer}>
      <div className="p-4">
        {loading && (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-accent/60 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && !config?.configured && (
          <p className="text-sm text-muted py-8 text-center">{t("shipping.notConfigured")}</p>
        )}

        {!loading && config?.configured && orderedGroups.length === 0 && (
          <p className="text-sm text-muted py-8 text-center">{t("checkout.noShippingOptions")}</p>
        )}

        {!loading && orderedGroups.map((group, gi) => {
          return (
            <div key={group.courier} className={gi > 0 ? "mt-4" : ""}>
              <p className="text-xs font-bold uppercase tracking-wider text-muted pb-2">{group.label}</p>
              <div className="space-y-2">
                {group.services.map((svc, si) => {
                  const isFirstOverall = gi === 0 && si === 0;
                  const badges: string[] = [];
                  if (!freeShipping && svc.cost === minCost) badges.push(t("checkout.cheapestBadge"));
                  if (parseMinDays(svc.etd) === minDays) badges.push(t("checkout.fastestBadge"));
                  if (isFirstOverall && !firstRecommendationUsed) {
                    badges.push(t("checkout.recommendedBadge"));
                    firstRecommendationUsed = true;
                  }

                  const isSelected = tempSelected?.name === group.courier && tempSelected?.service === svc.service;
                  return (
                    <button
                      key={`${group.courier}-${svc.service}`}
                      type="button"
                      onClick={() => setTempSelected({ name: group.courier, service: svc.service, cost: svc.cost, etd: svc.etd })}
                      className={cn(
                        "w-full flex items-center gap-3 p-3.5 border rounded-xl text-left transition-colors",
                        isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      )}
                    >
                      <div className={cn("w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center", isSelected ? "border-primary" : "border-muted")}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-semibold">{svc.service}</span>
                          {badges.map((b) => (
                            <span key={b} className={cn(
                              "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                              b === t("checkout.cheapestBadge") ? "bg-success/10 text-success"
                              : b === t("checkout.fastestBadge") ? "bg-blue-50 text-blue-600"
                              : "bg-primary/10 text-primary"
                            )}>
                              {b}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-muted">{t("checkout.shippingEstimate", { etd: svc.etd })}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        {freeShipping ? (
                          <span className="text-sm font-bold text-success">{t("checkout.freeShipping")}</span>
                        ) : (
                          <span className="text-sm font-semibold">{formatPrice(svc.cost, "IDR", locale)}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </BottomSheet>
  );
}

// ─────────────────────────────────────────────
// Payment Sheet (full screen)
// ─────────────────────────────────────────────

interface PaymentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  methods: KomercePaymentMethod[];
  loading: boolean;
  selected: KomercePaymentMethod | null;
  onConfirm: (m: KomercePaymentMethod) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

type PaymentTab = "va" | "qris" | "ewallet";

function PaymentSheet({ isOpen, onClose, methods, loading, selected, onConfirm, t }: PaymentSheetProps) {
  const [activeTab, setActiveTab] = useState<PaymentTab>("va");
  const [tempSelected, setTempSelected] = useState<KomercePaymentMethod | null>(selected);

  useEffect(() => {
    if (isOpen) {
      setTempSelected(selected);
      if (selected) setActiveTab((selected.paymentType as PaymentTab) ?? "va");
    }
  }, [isOpen, selected]);

  const vaList = methods.filter((m) => m.paymentType === "va");
  const qrisList = methods.filter((m) => m.paymentType === "qris");
  const ewalletList = methods.filter((m) => (m.paymentType as string) === "ewallet");

  const tabs: Array<{ key: PaymentTab; label: string; show: boolean }> = [
    { key: "va" as PaymentTab, label: t("checkout.paymentTabVA"), show: vaList.length > 0 || loading },
    { key: "qris" as PaymentTab, label: t("checkout.paymentTabQRIS"), show: qrisList.length > 0 || loading },
    { key: "ewallet" as PaymentTab, label: t("checkout.paymentTabEwallet"), show: ewalletList.length > 0 },
  ].filter((tab) => tab.show);

  const visibleMethods =
    activeTab === "va" ? vaList
    : activeTab === "qris" ? qrisList
    : ewalletList;

  const footer = (
    <button
      type="button"
      disabled={!tempSelected}
      onClick={() => tempSelected && onConfirm(tempSelected)}
      className={cn(
        "w-full h-12 rounded-full text-sm font-bold transition-colors",
        tempSelected ? "bg-primary text-white hover:bg-primary/90" : "bg-muted/30 text-muted cursor-not-allowed"
      )}
    >
      {t("checkout.confirm")}
    </button>
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t("checkout.paymentMethodCard")} fullScreen footer={footer}>
      {/* Sticky tab bar */}
      {tabs.length > 1 && (
        <div className="flex border-b border-border px-4 bg-white sticky top-0 z-10">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors",
                activeTab === tab.key ? "text-primary border-b-2 border-primary -mb-px" : "text-muted hover:text-primary"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="p-4 space-y-2">
        {loading && (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-accent/60 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && visibleMethods.length === 0 && (
          <p className="text-sm text-muted py-8 text-center">{t("checkout.noPaymentMethods")}</p>
        )}

        {!loading && visibleMethods.map((method) => {
          const isEwallet = method.paymentType === "ewallet";
          const isSelected = tempSelected?.bankCode === method.bankCode && tempSelected?.paymentType === method.paymentType;
          return (
            <button
              key={`${method.paymentType}-${method.bankCode}`}
              type="button"
              disabled={isEwallet}
              onClick={() => setTempSelected(method)}
              className={cn(
                "w-full flex items-center gap-3 p-3.5 border rounded-xl text-left transition-colors",
                isEwallet
                  ? "border-border bg-accent/40 opacity-60 cursor-not-allowed"
                  : isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
              )}
            >
              <div className={cn("w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center", isSelected ? "border-primary" : "border-muted")}>
                {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              {method.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={method.logoUrl} alt={method.displayName} className="w-10 h-7 object-contain shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{method.displayName}</p>
                {method.paymentType === "va" && (
                  <p className="text-xs text-muted">{t("checkout.paymentVaDesc")}</p>
                )}
                {method.paymentType === "qris" && (
                  <p className="text-xs text-muted">{t("checkout.paymentQrisDesc")}</p>
                )}
                {isEwallet && (
                  <p className="text-xs text-destructive">{t("checkout.paymentEwalletUnavailable")}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}

// ─────────────────────────────────────────────
// Notes Sheet
// ─────────────────────────────────────────────

interface NotesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  noteOption: "front" | "lobby" | "custom" | "";
  customNote: string;
  onConfirm: (opt: "front" | "lobby" | "custom" | "", note: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

function NotesSheet({ isOpen, onClose, noteOption, customNote, onConfirm, t }: NotesSheetProps) {
  const [tempOpt, setTempOpt] = useState<"front" | "lobby" | "custom" | "">(noteOption);
  const [tempNote, setTempNote] = useState(customNote);

  useEffect(() => {
    if (isOpen) { setTempOpt(noteOption); setTempNote(customNote); }
  }, [isOpen, noteOption, customNote]);

  const OPTIONS: Array<{ key: "front" | "lobby" | "custom"; label: string }> = [
    { key: "front", label: t("checkout.leaveAtFront") },
    { key: "lobby", label: t("checkout.leaveAtLobby") },
    { key: "custom", label: t("checkout.customNote") },
  ];

  const footer = (
    <button
      type="button"
      onClick={() => onConfirm(tempOpt, tempNote)}
      className="w-full h-12 rounded-full text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors"
    >
      {t("checkout.confirm")}
    </button>
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t("checkout.deliveryNoteCard")} footer={footer}>
      <div className="p-4 space-y-2">
        {OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTempOpt(key)}
            className={cn(
              "w-full flex items-center gap-3 p-3.5 border rounded-xl text-left transition-colors",
              tempOpt === key ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
            )}
          >
            <div className={cn("w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center", tempOpt === key ? "border-primary" : "border-muted")}>
              {tempOpt === key && <div className="w-2 h-2 rounded-full bg-primary" />}
            </div>
            <span className="text-sm">{label}</span>
          </button>
        ))}

        {tempOpt === "custom" && (
          <textarea
            placeholder={t("checkout.customNotePlaceholder")}
            value={tempNote}
            onChange={(e) => setTempNote(e.target.value)}
            rows={3}
            autoFocus
            className="w-full mt-2 px-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        )}
      </div>
    </BottomSheet>
  );
}

// ─────────────────────────────────────────────
// Voucher Sheet
// ─────────────────────────────────────────────

interface UserVoucher {
  id: string;
  status: "UNUSED" | "USED" | "EXPIRED";
  coupon: {
    code: string;
    type: string;
    value: number;
    minPurchase: number | null;
    maxDiscount: number | null;
    endDate: string | null;
  };
}

interface VoucherSheetProps {
  isOpen: boolean;
  onClose: () => void;
  appliedCoupon: AppliedCoupon | null;
  subtotal: number;
  city: string;
  province: string;
  productIds: string[];
  onApply: (c: AppliedCoupon) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: string;
}

function VoucherSheet({ isOpen, onClose, appliedCoupon, subtotal, city, province, productIds, onApply, t, locale }: VoucherSheetProps) {
  const [code, setCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const [vouchers, setVouchers] = useState<UserVoucher[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCode(appliedCoupon?.code ?? "");
    setError("");
    setLoadingVouchers(true);
    fetch("/api/account/vouchers")
      .then((r) => r.json())
      .then((json) => { if (json.success) setVouchers(json.data ?? []); })
      .catch(() => {})
      .finally(() => setLoadingVouchers(false));
  }, [isOpen, appliedCoupon]);

  async function applyCode(inputCode: string) {
    const trimmed = inputCode.trim().toUpperCase();
    if (!trimmed) return;
    setApplying(true);
    setError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed, subtotal, province, city, productIds }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.message ?? "Gagal memvalidasi voucher"); return; }
      if (!json.data?.valid) { setError(json.data?.message ?? "Voucher tidak valid"); return; }
      onApply({ code: json.data.code, type: json.data.type, discount: json.data.discount ?? 0 });
    } catch {
      setError("Gagal memvalidasi voucher");
    } finally {
      setApplying(false);
    }
  }

  const unusedVouchers = vouchers.filter((v) => v.status === "UNUSED");

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t("checkout.voucherCard")}>
      <div className="p-4 space-y-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {/* Code input */}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
            placeholder={t("checkout.voucherCodePlaceholder")}
            className="flex-1 h-10 px-3 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary uppercase"
          />
          <button
            type="button"
            disabled={!code.trim() || applying}
            onClick={() => applyCode(code)}
            className={cn(
              "h-10 px-4 rounded-lg text-sm font-semibold shrink-0 transition-colors",
              code.trim() && !applying ? "bg-primary text-white hover:bg-primary/90" : "bg-muted/30 text-muted cursor-not-allowed"
            )}
          >
            {applying ? "..." : t("checkout.applyVoucher")}
          </button>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        {/* User vouchers */}
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">{t("checkout.myVouchers")}</p>

          {loadingVouchers && (
            <div className="space-y-2">
              {[1, 2].map((i) => <div key={i} className="h-14 bg-accent/60 rounded-xl animate-pulse" />)}
            </div>
          )}

          {!loadingVouchers && unusedVouchers.length === 0 && (
            <div className="py-6 text-center space-y-1">
              <p className="text-sm font-semibold">{t("checkout.voucherNoSaved")}</p>
              <p className="text-xs text-muted">{t("checkout.voucherNoSavedDesc")}</p>
            </div>
          )}

          <div className="space-y-2">
            {unusedVouchers.map((v) => {
              const isApplied = appliedCoupon?.code === v.coupon.code;
              return (
                <div
                  key={v.id}
                  className={cn(
                    "p-3.5 border rounded-xl flex items-center justify-between gap-3",
                    isApplied ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold">{v.coupon.code}</p>
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                        v.coupon.type === "FREE_SHIPPING" ? "bg-blue-50 text-blue-600"
                        : v.coupon.type === "PERCENTAGE" ? "bg-success/10 text-success"
                        : "bg-orange-50 text-orange-600"
                      )}>
                        {v.coupon.type === "FREE_SHIPPING" ? "Gratis Ongkir"
                          : v.coupon.type === "PERCENTAGE" ? `${v.coupon.value}%`
                          : formatPrice(v.coupon.value, "IDR", locale)}
                      </span>
                    </div>
                    {v.coupon.minPurchase != null && v.coupon.minPurchase > 0 && (
                      <p className="text-xs text-muted">Min. {formatPrice(v.coupon.minPurchase, "IDR", locale)}</p>
                    )}
                    {v.coupon.endDate && (
                      <p className="text-xs text-muted">
                        s.d.{" "}
                        {new Date(v.coupon.endDate).toLocaleDateString("id-ID", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => applyCode(v.coupon.code)}
                    disabled={applying || isApplied}
                    className={cn(
                      "shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors",
                      isApplied
                        ? "border-primary/30 text-primary/50 cursor-default"
                        : "border-primary text-primary hover:bg-primary hover:text-white"
                    )}
                  >
                    {isApplied ? "Dipakai" : t("checkout.useThis")}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
