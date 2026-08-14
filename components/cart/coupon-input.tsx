"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/client";
import type { CouponType } from "@/types";

interface CouponResult {
  valid: boolean;
  code: string;
  type: CouponType;
  discount: number;
  message: string;
}

interface CouponInputProps {
  subtotal: number;
  productIds?: string[];
  onApply: (coupon: { code: string; type: CouponType; discount: number; message: string }) => void;
  onRemove: () => void;
  appliedCode?: string | null;
  className?: string;
}

export function CouponInput({ subtotal, productIds, onApply, onRemove, appliedCode, className }: CouponInputProps) {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CouponResult | null>(null);

  async function handleApply() {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), subtotal, productIds: productIds ?? [] }),
      });
      const json = await res.json();
      const data = json.data ?? json;

      if (data.valid) {
        onApply({ code: data.code, type: data.type, discount: data.discount, message: data.message });
      }
      setResult(data);
    } catch {
      setResult({ valid: false, code, type: "FIXED", discount: 0, message: t("cart.couponError") });
    } finally {
      setLoading(false);
    }
  }

  function handleRemove() {
    onRemove();
    setCode("");
    setResult(null);
  }

  if (appliedCode) {
    return (
      <div className={cn("flex items-center justify-between py-2", className)}>
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-success shrink-0">
            <path d="M3 7L5.5 9.5L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm font-medium">{appliedCode}</span>
        </div>
        <button onClick={handleRemove} className="text-xs text-muted hover:text-destructive transition-colors">
          {t("cart.removeCoupon")}
        </button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-xs font-semibold tracking-widest uppercase text-muted">
        {t("cart.couponCode")}
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
          placeholder={t("cart.couponPlaceholder")}
          className="flex-1 h-9 px-3 text-sm border border-border rounded-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
          disabled={loading}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={handleApply}
          disabled={loading || !code.trim()}
        >
          {loading ? "..." : t("cart.applyCoupon")}
        </Button>
      </div>
      {result && (
        <p className={cn("text-xs", result.valid ? "text-success" : "text-destructive")}>
          {result.message}
        </p>
      )}
    </div>
  );
}
