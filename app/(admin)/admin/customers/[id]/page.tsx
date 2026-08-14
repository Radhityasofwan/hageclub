"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDateTime } from "@/lib/utils";

type Segment = "NEW" | "REGULAR" | "VIP";
type VoucherStatus = "UNUSED" | "USED" | "EXPIRED";

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
  isDefault: boolean;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  discount: number;
  couponCode: string | null;
  createdAt: string;
  payment: { method: string; status: string } | null;
}

interface VoucherClaim {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  value: number;
  claimedAt: string;
  status: VoucherStatus;
}

interface CustomerDetail {
  id: string;
  email: string;
  emailVerified: boolean;
  joinedAt: string;
  profile: { firstName: string; lastName: string; phone: string | null; city: string | null; birthDate: string | null } | null;
  adminNotes: string | null;
  addresses: Address[];
  segment: Segment;
  totalOrders: number;
  paidOrders: number;
  totalSpent: number;
  avgOrderValue: number;
  lastOrderAt: string | null;
  wishlistCount: number;
  orders: Order[];
  voucherClaims: VoucherClaim[];
}

const STATUS_VARIANTS: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  PENDING: "default", PAID: "info", PROCESSING: "warning", PACKED: "info",
  SHIPPED: "info", DELIVERED: "success", COMPLETED: "success", CANCELLED: "danger", REFUNDED: "danger",
};

const SEGMENT_STYLE: Record<Segment, string> = {
  VIP: "text-amber-700 bg-amber-50 border-amber-200",
  REGULAR: "text-blue-700 bg-blue-50 border-blue-200",
  NEW: "text-muted bg-accent border-border",
};

const VOUCHER_STATUS: Record<VoucherStatus, { label: string; color: string }> = {
  UNUSED: { label: "Belum dipakai", color: "text-success" },
  USED: { label: "Sudah dipakai", color: "text-muted" },
  EXPIRED: { label: "Kadaluarsa", color: "text-destructive" },
};

export default function CustomerDetailPage() {
  const params = useParams();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchCustomer = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/customers/${params.id}`);
      const json = await res.json();
      if (json.success) {
        setCustomer(json.data);
        setNotes(json.data.adminNotes ?? "");
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { fetchCustomer(); }, [fetchCustomer]);

  async function saveNotes() {
    if (!customer) return;
    setNotesSaving(true);
    try {
      await fetch(`/api/admin/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: notes }),
      });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch {
      // silent
    } finally {
      setNotesSaving(false);
    }
  }

  function copyEmail() {
    if (!customer) return;
    navigator.clipboard.writeText(customer.email).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function formatVoucherDiscount(vc: VoucherClaim) {
    if (vc.type === "FREE_SHIPPING") return "Gratis Ongkir";
    if (vc.type === "PERCENTAGE") return `Diskon ${vc.value}%`;
    return `Potongan ${formatPrice(vc.value)}`;
  }

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 bg-accent rounded w-48" /><div className="h-64 bg-accent rounded" /></div>;
  }

  if (!customer) {
    return (
      <div className="text-center py-8 text-sm text-muted">
        Customer not found.
        <br />
        <Link href="/admin/customers" className="text-primary hover:underline mt-2 inline-block">← Back to Customers</Link>
      </div>
    );
  }

  const name = customer.profile
    ? `${customer.profile.firstName} ${customer.profile.lastName}`.trim()
    : customer.email.split("@")[0];

  function toWaNumber(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("0")) return "62" + digits.slice(1);
    if (digits.startsWith("62")) return digits;
    return digits;
  }

  const waPhone = customer.profile?.phone ? toWaNumber(customer.profile.phone) : null;
  const waHref = waPhone ? `https://wa.me/${waPhone}` : null;

  return (
    <div className="space-y-5">
      <Link href="/admin/customers" className="text-xs text-muted hover:text-primary transition-colors">← Semua Customers</Link>

      {/* Profile header */}
      <div className="bg-white border border-border rounded p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold shrink-0">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold">{name}</h1>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${SEGMENT_STYLE[customer.segment]}`}>
                  {customer.segment}
                </span>
                {customer.emailVerified ? (
                  <span className="text-[10px] text-success bg-success/10 px-1.5 py-0.5 rounded">✓ verified</span>
                ) : (
                  <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">unverified</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted">{customer.email}</p>
                <button
                  onClick={copyEmail}
                  className="text-[10px] text-muted hover:text-primary transition-colors"
                  title="Copy email"
                >
                  {copied ? "✓ copied" : "copy"}
                </button>
              </div>
              {customer.profile?.phone && (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted">{customer.profile.phone}</p>
                  {waHref && (
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 h-6 px-2 rounded text-[10px] font-semibold bg-[#25D366] text-white hover:bg-[#20BD5C] transition-colors"
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                        <path d="M10 1C5.03 1 1 5.03 1 10c0 1.56.41 3.12 1.19 4.5L1 19l4.66-1.19A8.96 8.96 0 0010 19c4.97 0 9-4.03 9-9s-4.03-9-9-9zm4.4 12.6c-.18.5-.9.95-1.47 1.07-.38.08-.88.14-2.57-.55-2.15-.87-3.54-3.04-3.64-3.18-.1-.14-.83-1.1-.83-2.1 0-1 .52-1.49.71-1.7.18-.2.4-.25.53-.25h.38c.12 0 .29-.05.45.35l.64 1.56c.05.12.08.27.02.41l-.23.45-.34.35c-.1.1-.21.21-.09.41.59.98 1.33 1.62 2.32 2.08.2.1.32.08.44-.05l.47-.55c.12-.14.24-.12.4-.07l1.53.72c.18.08.29.12.33.2.05.34-.1.74-.28 1.24z" />
                      </svg>
                      WA
                    </a>
                  )}
                </div>
              )}
              {customer.profile?.city && <p className="text-xs text-muted">{customer.profile.city}</p>}
            </div>
          </div>
          <div className="text-right text-xs text-muted shrink-0">
            <p>Bergabung</p>
            <p className="font-medium text-primary">{formatDateTime(customer.joinedAt)}</p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Order", value: String(customer.totalOrders), sub: `${customer.paidOrders} dibayar` },
          { label: "Total Spent", value: formatPrice(customer.totalSpent), sub: "order dibayar" },
          { label: "Avg Order", value: formatPrice(customer.avgOrderValue), sub: "per transaksi" },
          { label: "Wishlist", value: String(customer.wishlistCount), sub: "produk" },
          { label: "Voucher", value: String(customer.voucherClaims.length), sub: `${customer.voucherClaims.filter((v) => v.status === "UNUSED").length} aktif` },
          {
            label: "Order Terakhir",
            value: customer.lastOrderAt ? formatDateTime(customer.lastOrderAt).slice(0, 10) : "—",
            sub: customer.lastOrderAt
              ? `${Math.floor((Date.now() - new Date(customer.lastOrderAt).getTime()) / 86400000)} hari lalu`
              : "belum pernah",
          },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-border rounded p-3 text-center">
            <p className="text-lg font-bold leading-tight">{s.value}</p>
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wide mt-0.5">{s.label}</p>
            <p className="text-[10px] text-muted mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Admin CRM Notes */}
      <div className="bg-white border border-border rounded p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Catatan Internal (CRM)</h3>
          <button
            onClick={saveNotes}
            disabled={notesSaving}
            className="h-7 px-3 bg-primary text-white text-xs font-medium rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {notesSaved ? "✓ Tersimpan" : notesSaving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Catatan follow-up, preferensi customer, riwayat komunikasi, segmentasi manual..."
          rows={4}
          className="w-full text-sm border border-border rounded p-3 resize-none focus:outline-none focus:ring-1 focus:ring-primary bg-accent/30 placeholder:text-muted/50"
        />
      </div>

      {/* Voucher Claims */}
      {customer.voucherClaims.length > 0 && (
        <div className="bg-white border border-border rounded">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">Voucher Diklaim</h3>
            <p className="text-xs text-muted">{customer.voucherClaims.length} voucher, {customer.voucherClaims.filter((v) => v.status === "UNUSED").length} aktif</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/50">
                  <th className="text-left px-5 py-2 text-xs font-medium text-muted uppercase">Kode</th>
                  <th className="text-left px-5 py-2 text-xs font-medium text-muted uppercase">Diskon</th>
                  <th className="text-left px-5 py-2 text-xs font-medium text-muted uppercase">Status</th>
                  <th className="text-right px-5 py-2 text-xs font-medium text-muted uppercase">Diklaim</th>
                </tr>
              </thead>
              <tbody>
                {customer.voucherClaims.map((vc) => {
                  const st = VOUCHER_STATUS[vc.status];
                  return (
                    <tr key={vc.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                      <td className="px-5 py-2.5 font-mono text-xs font-bold">{vc.code}</td>
                      <td className="px-5 py-2.5 text-xs">{formatVoucherDiscount(vc)}</td>
                      <td className={`px-5 py-2.5 text-xs font-medium ${st.color}`}>{st.label}</td>
                      <td className="px-5 py-2.5 text-right text-xs text-muted">{formatDateTime(vc.claimedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order history */}
      <div className="bg-white border border-border rounded">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Riwayat Pesanan</h3>
          <p className="text-xs text-muted">{customer.totalOrders} pesanan · {customer.paidOrders} dibayar</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Order</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Bayar</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Kupon</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase">Total</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {customer.orders.map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                  <td className="px-5 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-mono text-xs text-primary hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={STATUS_VARIANTS[o.status] ?? "default"} size="sm">{o.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted uppercase">{o.payment?.method ?? "—"}</td>
                  <td className="px-5 py-3">
                    {o.couponCode ? (
                      <span className="font-mono text-xs text-success">{o.couponCode}</span>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                    {o.discount > 0 && (
                      <span className="text-xs text-muted ml-1">(-{formatPrice(o.discount)})</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right font-medium">{formatPrice(o.total)}</td>
                  <td className="px-5 py-3 text-right text-xs text-muted">{formatDateTime(o.createdAt)}</td>
                </tr>
              ))}
              {customer.orders.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-muted">Belum ada pesanan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Saved Addresses */}
      {customer.addresses.length > 0 && (
        <div className="bg-white border border-border rounded">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">Alamat Tersimpan</h3>
          </div>
          <div className="divide-y divide-border">
            {customer.addresses.map((addr) => (
              <div key={addr.id} className="px-5 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-xs">{addr.label}</span>
                  {addr.isDefault && <Badge size="sm">Default</Badge>}
                </div>
                <p className="text-xs text-muted mt-1">{addr.recipientName} · {addr.phone}</p>
                <p className="text-xs text-muted">{addr.street}, {addr.district}, {addr.city}, {addr.province} {addr.postalCode}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
