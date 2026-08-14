"use client";

import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import { formatPrice, formatDateShort, cn } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/checkout/order-status-badge";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/toast";
import { useSheetExit } from "@/hooks/use-sheet-exit";

type Tab = "orders" | "wishlist";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: Array<{ name: string; imageUrl?: string | null }>;
}

interface WishlistItem {
  id: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    salePrice: number | null;
    images: Array<{ url: string }>;
  };
}

interface ActiveVoucher {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  value: number;
  endDate: string | null;
  minPurchase: number | null;
  maxDiscount: number | null;
}

interface Props {
  initials: string;
  name: string;
  email: string;
  orders: Order[];
  wishlistItems: WishlistItem[];
  activeVouchers: ActiveVoucher[];
  initialTab?: Tab;
}

const STATUS_FILTERS = [
  { key: "", labelKey: "filterStatus" },
  { key: "PENDING", labelKey: "filterPending" },
  { key: "PROCESSING", labelKey: "filterProcessing" },
  { key: "SHIPPED", labelKey: "filterShipped" },
  { key: "COMPLETED", labelKey: "filterCompleted" },
  { key: "CANCELLED", labelKey: "filterCancelled" },
] as const;

// Sinkron dengan FILTERS di app/(public)/account/orders/page.tsx —
// PAID masuk grup Diproses (order dibayar, belum diproses admin).
const STATUS_GROUP: Record<string, string[]> = {
  PROCESSING: ["PAID", "PROCESSING", "PACKED"],
  COMPLETED: ["DELIVERED", "COMPLETED"],
  CANCELLED: ["CANCELLED", "REFUNDED"],
};

export function AccountDashboardClient({
  name, orders, wishlistItems, activeVouchers, initialTab = "orders",
}: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [statusFilter, setStatusFilter] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [findingOrders, setFindingOrders] = useState(false);
  const [restoreSheetOpen, setRestoreSheetOpen] = useState(false);
  const [hiddenCount, setHiddenCount] = useState(0);
  const [restoring, setRestoring] = useState(false);

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    router.replace(tab === "orders" ? "/account" : "/account?tab=wishlist", {
      scroll: false,
    });
  }

  const filteredOrders = useMemo(() => {
    if (!statusFilter) return orders;
    const statuses = STATUS_GROUP[statusFilter] ?? [statusFilter];
    return orders.filter((o) => statuses.includes(o.status));
  }, [orders, statusFilter]);

  // Cari order guest (device/browser lain) yang guestEmail-nya cocok dengan email akun
  async function handleFindOrders() {
    if (findingOrders) return;
    setFindingOrders(true);
    try {
      const res = await fetch("/api/account/hidden-orders");
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast(t("account.errorOccurred"), { variant: "error" });
        return;
      }
      const found = (json.data ?? []) as Array<{ id: string }>;
      if (found.length === 0) {
        toast(t("account.noHiddenOrders"), { variant: "info" });
        return;
      }
      setHiddenCount(found.length);
      setRestoreSheetOpen(true);
    } catch {
      toast(t("account.errorOccurred"), { variant: "error" });
    } finally {
      setFindingOrders(false);
    }
  }

  // Tautkan order guest ke akun → muncul kembali di daftar order
  async function handleRestoreOrders() {
    if (restoring) return;
    setRestoring(true);
    try {
      const res = await fetch("/api/account/restore-orders", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast(t("account.errorOccurred"), { variant: "error" });
        return;
      }
      const restored = (json.data?.restored ?? 0) as number;
      setRestoreSheetOpen(false);
      toast(t("account.ordersRestored", { count: restored }), { variant: "success" });
      router.refresh();
    } catch {
      toast(t("account.errorOccurred"), { variant: "error" });
    } finally {
      setRestoring(false);
    }
  }

  async function handleCopy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const el = document.createElement("textarea");
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  function discountLabel(v: ActiveVoucher) {
    if (v.type === "FREE_SHIPPING") return t("account.voucherFreeShipping");
    if (v.type === "PERCENTAGE")
      return t("account.voucherDiscountPct", { value: v.value });
    return t("account.voucherDiscountFixed", {
      value: formatPrice(v.value, "IDR", locale),
    });
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="max-w-md mx-auto px-4 py-6 space-y-5 md:max-w-3xl md:py-10">

        {/* Greeting row */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-lg font-bold text-primary leading-tight">
            Hai, <span className="truncate">{name}</span> 👋
          </p>
          <Link
            href="/account/settings"
            className="shrink-0 px-4 py-1.5 border border-primary text-primary text-xs font-semibold rounded-full hover:bg-primary hover:text-white transition-colors"
          >
            {t("account.settings")}
          </Link>
        </div>

        {/* ── Voucher Section ── */}
        <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 pt-4 pb-3">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary shrink-0">
              <rect x="1.5" y="5.5" width="17" height="9" rx="1.5" />
              <path d="M8 5.5v9M1.5 10h2.5M16 10h2.5" strokeLinecap="round" />
            </svg>
            <span className="text-sm font-semibold text-foreground">
              {t("account.myVouchersSection")}
            </span>
            {activeVouchers.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-primary text-white text-[10px] font-bold">
                {activeVouchers.length}
              </span>
            )}
          </div>

          {/* Content */}
          {activeVouchers.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-8 px-4 gap-2 border-t border-border">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
                  <rect x="1.5" y="5.5" width="17" height="9" rx="1.5" />
                  <path d="M8 5.5v9M1.5 10h2.5M16 10h2.5" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-sm font-medium text-foreground text-center">
                {t("account.voucherEmpty")}
              </p>
              <p className="text-xs text-muted text-center leading-relaxed">
                {t("account.voucherEmptyDesc")}
              </p>
            </div>
          ) : (
            /* Voucher list */
            <div className="divide-y divide-border border-t border-border">
              {activeVouchers.slice(0, 3).map((v) => (
                <div key={v.id} className="flex items-center gap-3 px-4 py-3">
                  {/* Left: type color dot */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    v.type === "FREE_SHIPPING"
                      ? "bg-blue-50"
                      : v.type === "PERCENTAGE"
                      ? "bg-green-50"
                      : "bg-orange-50"
                  }`}>
                    {v.type === "FREE_SHIPPING" ? (
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-500">
                        <path d="M1 5h9v8H1zM10 7l2 1.5L14 7v6h-4V7zM1 5V3a2 2 0 012-2h5a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : v.type === "PERCENTAGE" ? (
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-green-600">
                        <circle cx="4.5" cy="4.5" r="1.5" />
                        <circle cx="11.5" cy="11.5" r="1.5" />
                        <path d="M13 3L3 13" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-orange-500">
                        <path d="M2 8h12M8 2v12" strokeLinecap="round" />
                      </svg>
                    )}
                  </div>

                  {/* Middle: label + validity */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-tight truncate">
                      {discountLabel(v)}
                    </p>
                    <p className="text-[11px] text-muted mt-0.5">
                      {v.endDate
                        ? t("account.voucherValidUntil", {
                            date: formatDateShort(new Date(v.endDate), locale),
                          })
                        : t("account.voucherNoExpiry")}
                    </p>
                  </div>

                  {/* Right: code + copy */}
                  <button
                    type="button"
                    onClick={() => handleCopy(v.code)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold font-mono shrink-0 transition-colors ${
                      copied === v.code
                        ? "border-success text-success bg-success/5"
                        : "border-primary/30 text-primary bg-primary/5 hover:bg-primary hover:text-white"
                    }`}
                    aria-label={`${t("account.voucherCopy")} ${v.code}`}
                  >
                    {copied === v.code ? (
                      <>
                        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                          <path d="M1.5 6l3 3.5 6-7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {t("account.voucherCopied")}
                      </>
                    ) : (
                      <>
                        <span className="tracking-wider">{v.code}</span>
                      </>
                    )}
                  </button>
                </div>
              ))}

            </div>
          )}
        </div>

        {/* Tab nav */}
        <div className="flex border-b border-border">
          {(["orders", "wishlist"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "text-primary border-b-2 border-primary -mb-px"
                  : "text-muted hover:text-primary"
              }`}
            >
              {tab === "orders" ? t("account.ordersTab") : t("account.wishlistTab")}
            </button>
          ))}
        </div>

        {/* Tab: Orders */}
        {activeTab === "orders" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 px-3 text-xs border border-border rounded-lg bg-white text-foreground focus:outline-none focus:border-primary transition-colors appearance-none"
              >
                {STATUS_FILTERS.map((f) => (
                  <option key={f.key} value={f.key}>
                    {t(`account.${f.labelKey}` as never)}
                  </option>
                ))}
              </select>
              <Link
                href="/account/orders"
                className="text-xs text-primary font-medium hover:underline shrink-0"
              >
                {t("account.viewAll")}
              </Link>
            </div>

            {/* Antisipasi order tersembunyi — order guest dari device/browser lain */}
            <button
              type="button"
              onClick={handleFindOrders}
              disabled={findingOrders}
              className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline disabled:opacity-60 transition-opacity"
            >
              {findingOrders ? (
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="animate-spin" aria-hidden="true">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
                  <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              )}
              {findingOrders ? t("common.loading") : t("account.findOrders")}
            </button>

            {filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
                    <path d="M3 6h18l-1.5 12H4.5L3 6zM7 6V4a2 2 0 014 0v2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  {statusFilter ? (
                    <>
                      <p className="text-sm font-semibold text-foreground">{t("account.noOrdersFiltered")}</p>
                      <p className="text-xs text-muted mt-1">{t("account.noOrdersFilteredDesc")}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-foreground">{t("account.noOrders")}</p>
                      <p className="text-xs text-muted mt-1">{t("account.noOrdersDesc")}</p>
                    </>
                  )}
                </div>
                <Link
                  href="/shop"
                  className="mt-1 px-5 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors"
                >
                  {t("account.startShopping")}
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/account/orders/${order.id}`}
                    className="group flex items-center gap-3.5 bg-white border border-border rounded-2xl px-4 py-3 hover:border-primary/30 hover:bg-primary/[0.015] transition-all"
                  >
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-accent overflow-hidden">
                      {order.items[0]?.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={order.items[0].imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted">
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                            <path d="M3 4.5h10l-1 9H4l-1-9zm2-1.5V2a2 2 0 014 0v1" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primary font-mono">#{order.orderNumber}</p>
                      <p className="text-xs text-muted">
                        {formatDateShort(new Date(order.createdAt), locale)}
                      </p>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <p className="text-sm font-semibold">
                        {formatPrice(order.total, "IDR", locale)}
                      </p>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-muted shrink-0 group-hover:text-primary transition-colors">
                      <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Wishlist */}
        {activeTab === "wishlist" && (
          <div className="space-y-3">
            {wishlistItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t("account.emptyWishlist")}</p>
                  <p className="text-xs text-muted mt-1">{t("account.emptyWishlistDesc")}</p>
                </div>
                <Link
                  href="/shop"
                  className="mt-1 px-5 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors"
                >
                  {t("account.shopNow")}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {wishlistItems.map((item) => {
                  const p = item.product;
                  const displayPrice = p.salePrice ?? p.price;
                  const hasSale = p.salePrice !== null && p.salePrice < p.price;
                  return (
                    <Link
                      key={item.id}
                      href={`/products/${p.slug}`}
                      className="group bg-white border border-border rounded-2xl p-3 space-y-2 hover:border-primary/30 transition-colors"
                    >
                      <div className="relative aspect-[3/4] bg-accent rounded-xl overflow-hidden">
                        {p.images[0] ? (
                          <Image
                            src={p.images[0].url}
                            alt={p.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 640px) 50vw, 25vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted">
                            {t("account.noImage")}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium line-clamp-2 leading-tight">{p.name}</p>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-xs font-semibold">
                            {formatPrice(displayPrice, "IDR", locale)}
                          </span>
                          {hasSale && (
                            <span className="text-[10px] text-muted line-through">
                              {formatPrice(p.price, "IDR", locale)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

          </div>
        )}
      </div>

      {/* ── Sheet konfirmasi kembalikan order tersembunyi ── */}
      <RestoreOrdersSheet
        open={restoreSheetOpen}
        onClose={() => setRestoreSheetOpen(false)}
        onConfirm={handleRestoreOrders}
        restoring={restoring}
        hiddenCount={hiddenCount}
        t={t}
      />
    </div>
  );
}

// ─── Restore Orders Bottom Sheet ─────────────────────────────────────────────

function RestoreOrdersSheet({
  open,
  onClose,
  onConfirm,
  restoring,
  hiddenCount,
  t,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  restoring: boolean;
  hiddenCount: number;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const { leaving, handleClose, visible } = useSheetExit(open, onClose);

  if (!visible) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col">
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300",
          open && !leaving ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
      />

      {/* Sheet */}
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
          <h2 className="text-base font-bold">{t("account.restoreOrdersTitle")}</h2>
          <p className="text-sm text-muted mt-2 leading-relaxed">
            {t("account.hiddenOrdersMessage", { count: hiddenCount })}
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-1 shrink-0 space-y-2">
          <button
            type="button"
            onClick={() => {
              if (leaving) return;
              handleClose();
              onConfirm();
            }}
            disabled={restoring}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {restoring ? t("common.loading") : t("account.restoreConfirm")}
          </button>
          <button
            type="button"
            onClick={handleClose}
            disabled={restoring}
            className="w-full h-11 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
          >
            {t("account.restoreCancel")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
