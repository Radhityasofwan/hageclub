"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice, formatDateTime } from "@/lib/utils";

type VoucherStatus = "UNUSED" | "USED" | "EXPIRED";

interface Voucher {
  id: string;
  claimedAt: string;
  status: VoucherStatus;
  coupon: {
    id: string;
    code: string;
    type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
    value: number;
    minPurchase: number | null;
    maxDiscount: number | null;
    usageLimit: number | null;
    usedCount: number;
    endDate: string | null;
  };
  usage: {
    orderId: string;
    orderNumber: string;
    usedAt: string;
  } | null;
}

const STATUS_CONFIG: Record<VoucherStatus, { label: string; color: string; bg: string; dot: string }> = {
  UNUSED:  { label: "Belum Dipakai", color: "#34C759", bg: "rgba(52,199,89,0.08)",  dot: "#34C759" },
  USED:    { label: "Sudah Dipakai",  color: "#8E8E93", bg: "rgba(142,142,147,0.1)", dot: "#8E8E93" },
  EXPIRED: { label: "Kadaluarsa",    color: "#FF3B30", bg: "rgba(255,59,48,0.08)",  dot: "#FF3B30" },
};

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [filter, setFilter] = useState<VoucherStatus | "ALL">("ALL");

  useEffect(() => {
    fetch("/api/account/vouchers")
      .then((r) => r.json())
      .then((j) => { if (j.success) setVouchers(j.data ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function copyCode(code: string) {
    try { await navigator.clipboard.writeText(code); }
    catch {
      const el = document.createElement("textarea");
      el.value = code; document.body.appendChild(el); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
    }
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  function formatDiscount(v: Voucher["coupon"]) {
    if (v.type === "FREE_SHIPPING") return "Gratis Ongkir";
    if (v.type === "PERCENTAGE") return `Diskon ${v.value}%`;
    return `Potongan ${formatPrice(v.value)}`;
  }

  const filtered = filter === "ALL" ? vouchers : vouchers.filter((v) => v.status === filter);
  const counts = {
    ALL:     vouchers.length,
    UNUSED:  vouchers.filter((v) => v.status === "UNUSED").length,
    USED:    vouchers.filter((v) => v.status === "USED").length,
    EXPIRED: vouchers.filter((v) => v.status === "EXPIRED").length,
  };

  const FILTERS: Array<{ key: VoucherStatus | "ALL"; label: string }> = [
    { key: "ALL",     label: `Semua (${counts.ALL})` },
    { key: "UNUSED",  label: `Belum Dipakai (${counts.UNUSED})` },
    { key: "USED",    label: `Sudah Dipakai (${counts.USED})` },
    { key: "EXPIRED", label: `Kadaluarsa (${counts.EXPIRED})` },
  ];

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6 md:max-w-3xl md:py-10">
      <div>
        <h1 className="text-xl font-bold">Voucher Saya</h1>
        <p className="text-sm text-muted mt-0.5">Riwayat voucher yang sudah kamu klaim</p>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:flex-wrap md:overflow-visible md:mx-0 md:px-0 md:pb-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 px-3.5 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              filter === f.key
                ? "bg-primary text-white border-primary"
                : "bg-white text-muted border-border hover:border-primary/40 hover:text-primary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-28 bg-accent rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-border rounded-2xl">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-muted mb-3">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <path d="M12 6V18M2 12h4M18 12h4" strokeLinecap="round" />
          </svg>
          <p className="text-sm font-medium text-primary">Belum ada voucher</p>
          <p className="text-xs text-muted mt-1">
            {filter === "ALL"
              ? "Klaim voucher dari promo yang muncul di website"
              : "Tidak ada voucher dengan status ini"}
          </p>
          {filter !== "ALL" && (
            <button
              onClick={() => setFilter("ALL")}
              className="mt-4 text-xs text-primary hover:underline"
            >
              Lihat semua voucher
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((v) => {
            const cfg = STATUS_CONFIG[v.status];
            const canCopy = v.status === "UNUSED";

            return (
              <div
                key={v.id}
                className="border border-border rounded-2xl overflow-hidden bg-white"
                style={{ opacity: v.status === "EXPIRED" ? 0.7 : 1 }}
              >
                {/* Top: discount + status */}
                <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
                  <div>
                    <p className="text-lg font-bold" style={{ color: "#1C1C1E" }}>
                      {formatDiscount(v.coupon)}
                    </p>
                    <div className="space-y-0.5 mt-0.5">
                      {v.coupon.minPurchase != null && (
                        <p className="text-xs text-muted">
                          Min. belanja {formatPrice(v.coupon.minPurchase)}
                        </p>
                      )}
                      {v.coupon.type === "PERCENTAGE" && v.coupon.maxDiscount != null && (
                        <p className="text-xs text-muted">
                          Maks. hemat {formatPrice(v.coupon.maxDiscount)}
                        </p>
                      )}
                      {v.coupon.endDate && (
                        <p className="text-xs text-muted">
                          Berlaku s.d.{" "}
                          {new Date(v.coupon.endDate).toLocaleDateString("id-ID", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <div
                    className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                    {cfg.label}
                  </div>
                </div>

                {/* Divider — perforated style */}
                <div className="flex items-center px-5">
                  <div
                    className="w-4 h-4 rounded-full shrink-0 -ml-9"
                    style={{ background: "#F5F5F5", border: "1px solid #E5E5EA" }}
                  />
                  <div className="flex-1 border-t border-dashed border-border mx-2" />
                  <div
                    className="w-4 h-4 rounded-full shrink-0 -mr-9"
                    style={{ background: "#F5F5F5", border: "1px solid #E5E5EA" }}
                  />
                </div>

                {/* Bottom: code + meta */}
                <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-4">
                  {/* Code */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="font-mono font-bold text-sm tracking-widest"
                      style={{ color: canCopy ? "#1C1C1E" : "#8E8E93" }}
                    >
                      {v.coupon.code}
                    </span>
                    {canCopy && (
                      <button
                        onClick={() => copyCode(v.coupon.code)}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors"
                        style={{
                          background: copied === v.coupon.code ? "rgba(52,199,89,0.1)" : "#F5F5F5",
                          color: copied === v.coupon.code ? "#34C759" : "#8E8E93",
                        }}
                      >
                        {copied === v.coupon.code ? (
                          <>
                            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                              <path d="M1.5 6l3 3.5 6-7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Tersalin
                          </>
                        ) : (
                          <>
                            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                              <rect x="1" y="4" width="7" height="7" rx="1.2" />
                              <path d="M4 4V2.5A1.5 1.5 0 015.5 1H9a1.5 1.5 0 011.5 1.5v5A1.5 1.5 0 019 9H7.5" />
                            </svg>
                            Salin
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Meta: used on order or claimed at */}
                  <div className="text-right shrink-0">
                    {v.usage ? (
                      <Link
                        href={`/account/orders/${v.usage.orderId}`}
                        className="text-xs text-primary hover:underline"
                      >
                        #{v.usage.orderNumber}
                      </Link>
                    ) : (
                      <p className="text-[11px] text-muted">
                        Diklaim {formatDateTime(v.claimedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hint */}
      {vouchers.some((v) => v.status === "UNUSED") && (
        <div
          className="flex items-start gap-3 px-4 py-3.5 rounded-xl text-sm"
          style={{ background: "rgba(28,28,30,0.04)" }}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 mt-0.5 shrink-0 text-muted">
            <circle cx="8" cy="8" r="6.5" />
            <path d="M8 7v4M8 5.5v.5" strokeLinecap="round" />
          </svg>
          <p className="text-xs text-muted leading-relaxed">
            Salin kode voucher dan tempel di kolom <strong className="text-primary">Kode Kupon</strong> saat checkout untuk mendapatkan diskon.
          </p>
        </div>
      )}
    </div>
  );
}
