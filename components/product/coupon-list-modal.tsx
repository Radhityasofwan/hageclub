"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/lib/i18n/client";
import { formatPrice, formatDateShort } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { REGION_GROUPS } from "@/lib/regions";
import type { CouponType } from "@/types";

interface PublicCoupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minPurchase: number | null;
  maxDiscount: number | null;
  endDate: string | null;
  popupTitle: string | null;
  allowedRegions: string | null;
}

// Map region key → label, computed once
const REGION_LABEL = new Map(REGION_GROUPS.map((r) => [r.key, r.label]));

function parseRegions(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

interface CouponListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CouponListModal({ isOpen, onClose }: CouponListModalProps) {
  const { t, locale } = useI18n();
  const [coupons, setCoupons] = useState<PublicCoupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || coupons.length > 0) return;
    setLoading(true);
    fetch("/api/coupons")
      .then((r) => r.json())
      .then((json) => setCoupons(json.data ?? []))
      .catch(() => setCoupons([]))
      .finally(() => setLoading(false));
  }, [isOpen, coupons.length]);

  function handleCopy(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function discountLabel(coupon: PublicCoupon) {
    if (coupon.type === "PERCENTAGE") {
      return t("product.couponTypePercentage", { value: coupon.value });
    }
    if (coupon.type === "FIXED") {
      return t("product.couponTypeFixed", { value: formatPrice(coupon.value, "IDR", locale) });
    }
    return t("product.couponTypeFreeShipping");
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("product.couponModalTitle")}
      size="sm"
    >
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin" />
        </div>
      ) : coupons.length === 0 ? (
        <p className="text-sm text-muted text-center py-8">{t("product.couponNone")}</p>
      ) : (
        <ul className="space-y-3">
          {coupons.map((coupon) => {
            const regions = coupon.type === "FREE_SHIPPING" ? parseRegions(coupon.allowedRegions) : [];
            const regionLabels = regions
              .map((k) => REGION_LABEL.get(k) ?? k)
              .join(", ");

            return (
              <li
                key={coupon.id}
                className="border border-dashed border-border rounded-sm p-3 flex flex-col gap-2"
              >
                {/* Judul kupon / label diskon */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-tight">
                      {coupon.popupTitle || discountLabel(coupon)}
                    </p>
                    {coupon.popupTitle && (
                      <p className="text-xs text-muted mt-0.5">{discountLabel(coupon)}</p>
                    )}
                  </div>
                  {/* Kode + tombol salin */}
                  <button
                    type="button"
                    onClick={() => handleCopy(coupon.code)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-sm border text-xs font-semibold shrink-0 transition-colors",
                      copied === coupon.code
                        ? "border-success text-success bg-success/5"
                        : "border-primary text-primary hover:bg-primary hover:text-white dark:hover:bg-white dark:hover:text-primary"
                    )}
                    aria-label={`${t("product.couponCopy")} ${coupon.code}`}
                  >
                    <span className="tracking-wider font-mono">{coupon.code}</span>
                    <span className="text-[10px] leading-none">
                      {copied === coupon.code ? t("product.couponCopied") : t("product.couponCopy")}
                    </span>
                  </button>
                </div>

                {/* Detail kupon */}
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {coupon.minPurchase != null && coupon.minPurchase > 0 && (
                    <span className="text-xs text-muted">
                      {t("product.couponMinPurchase", {
                        value: formatPrice(coupon.minPurchase, "IDR", locale),
                      })}
                    </span>
                  )}
                  {coupon.maxDiscount != null && coupon.type === "PERCENTAGE" && (
                    <span className="text-xs text-muted">
                      {t("product.couponMaxDiscount", {
                        value: formatPrice(coupon.maxDiscount, "IDR", locale),
                      })}
                    </span>
                  )}
                  {coupon.endDate && (
                    <span className="text-xs text-muted">
                      {t("product.couponValidUntil", {
                        date: formatDateShort(new Date(coupon.endDate), locale),
                      })}
                    </span>
                  )}
                </div>

                {/* Info wilayah — hanya untuk FREE_SHIPPING */}
                {coupon.type === "FREE_SHIPPING" && (
                  <div className="flex items-start gap-1.5 pt-0.5">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                      className="text-muted shrink-0 mt-0.5"
                    >
                      <path
                        d="M8 1.5C5.51 1.5 3.5 3.51 3.5 6c0 3.75 4.5 8.5 4.5 8.5S12.5 9.75 12.5 6c0-2.49-2.01-4.5-4.5-4.5ZM8 7.75A1.75 1.75 0 1 1 8 4.25 1.75 1.75 0 0 1 8 7.75Z"
                        fill="currentColor"
                      />
                    </svg>
                    <span className="text-xs text-muted leading-relaxed">
                      {regions.length > 0
                        ? t("product.couponRegions", { regions: regionLabels })
                        : t("product.couponAllRegions")}
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
