"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CouponForm } from "@/components/admin/coupon-form";
import { formatPrice, formatDateTime } from "@/lib/utils";

interface CouponDetail {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  value: number;
  minPurchase: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  usedCount: number;
  showAsPopup: boolean;
  popupTitle: string | null;
  popupPriority: number | null;
  applicableCategory: string | null;
  applicableProduct: string | null;
  allowedRegions: string | null;
}

interface UsageRecord {
  id: string;
  orderNumber: string;
  orderTotal: number;
  usedAt: string;
  customer: string;
}

export default function CouponEditPage() {
  const params = useParams();
  const [coupon, setCoupon] = useState<CouponDetail | null>(null);
  const [usages, setUsages] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCoupon = useCallback(async () => {
    try {
      const [detailRes, usageRes] = await Promise.all([
        fetch(`/api/admin/coupons/${params.id}`),
        fetch(`/api/admin/coupons/${params.id}/usage`),
      ]);
      const detailJson = await detailRes.json();
      const usageJson = await usageRes.json();
      if (detailJson.success) setCoupon(detailJson.data);
      if (usageJson.success) setUsages(usageJson.data.usages ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { fetchCoupon(); }, [fetchCoupon]);

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 bg-accent rounded w-48" /><div className="h-64 bg-accent rounded" /></div>;
  }

  if (!coupon) {
    return <div className="text-center py-8 text-sm text-muted">Coupon not found.<br /><Link href="/admin/coupons" className="text-primary hover:underline mt-2 inline-block">← Back to Coupons</Link></div>;
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/coupons" className="text-xs text-muted hover:text-primary transition-colors">← Back to Coupons</Link>

      <CouponForm
        initialData={{
          id: coupon.id,
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          minPurchase: coupon.minPurchase,
          maxDiscount: coupon.maxDiscount,
          usageLimit: coupon.usageLimit,
          startDate: coupon.startDate,
          endDate: coupon.endDate,
          isActive: coupon.isActive,
          showAsPopup: coupon.showAsPopup,
          popupTitle: coupon.popupTitle,
          applicableCategory: coupon.applicableCategory,
          applicableProduct: coupon.applicableProduct,
          allowedRegions: coupon.allowedRegions,
        }}
      />

      {/* Usage history */}
      <div className="bg-white border border-border rounded">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Usage History</h3>
          <p className="text-xs text-muted">{usages.length} used{coupon.usageLimit ? ` / ${coupon.usageLimit} limit` : ""}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Order</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase">Customer</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase">Total</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase">Used At</th>
              </tr>
            </thead>
            <tbody>
              {usages.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                  <td className="px-5 py-3">
                    <Link href={`/admin/orders/${u.id}`} className="font-mono text-xs text-primary hover:underline">
                      {u.orderNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted">{u.customer}</td>
                  <td className="px-5 py-3 text-right">{formatPrice(u.orderTotal)}</td>
                  <td className="px-5 py-3 text-right text-xs text-muted">{formatDateTime(u.usedAt)}</td>
                </tr>
              ))}
              {usages.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-muted">No usage history yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
