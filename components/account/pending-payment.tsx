"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CopyBtn } from "@/components/checkout/copy-button";
import { PaymentAccordion, type AccordionItem } from "@/components/checkout/payment-accordion";
import { useI18n } from "@/lib/i18n/client";
import { useCountdown } from "@/hooks/use-countdown";
import { formatPrice } from "@/lib/utils";
import type { KomercePaymentMethod } from "@/types";

export interface PendingPaymentData {
  method: string;
  paymentToken: string | null;
  paymentUrl: string | null;
  vaNumber: string | null;
  vaBank: string | null;
  amount: number;
  finalAmount: number | null;
  expiresAt: string | null;
}

interface PendingPaymentProps {
  orderId: string;
  payment: PendingPaymentData;
  accountName?: string | null;
}

// Kartu pembayaran aktif (VA/QRIS + countdown + instruksi) — tampilannya
// disinkronkan dengan halaman checkout success supaya konsisten.
export function PendingPayment({ orderId, payment, accountName }: PendingPaymentProps) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const countdown = useCountdown(payment.expiresAt);
  const [refreshing, setRefreshing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const isQris = payment.method?.toUpperCase() === "QRIS";
  const payableAmount = payment.finalAmount ?? payment.amount;

  // Logo + nama bank lengkap (sama seperti checkout success)
  const [bankMethods, setBankMethods] = useState<KomercePaymentMethod[]>([]);
  useEffect(() => {
    fetch("/api/checkout/payment-methods")
      .then((r) => r.json())
      .then((j) => { if (j.success) setBankMethods(j.data ?? []); })
      .catch(() => {});
  }, []);
  const bankMethod = bankMethods.find(
    (m) => m.paymentType === "va" && m.bankCode?.toUpperCase() === (payment.vaBank ?? "").toUpperCase()
  );

  const steps = (): AccordionItem[] => {
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
    const bank = bankMethod?.displayName || payment.vaBank || t("payment.destination");
    return [
      {
        id: "atm",
        label: t("payment.atm"),
        steps: [
          t("payment.vaAtmStep1"),
          t("payment.vaAtmStep2"),
          t("payment.vaAtmStep3", { bank }),
          t("payment.vaAtmStep4", { vaNumber: payment.vaNumber ?? "" }),
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
          t("payment.vaMbStep3", { vaNumber: payment.vaNumber ?? "" }),
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
          t("payment.vaIbStep4", { vaNumber: payment.vaNumber ?? "" }),
          t("payment.vaIbStep5", { amount: formatPrice(payableAmount, "IDR", locale) }),
          t("payment.vaIbStep6"),
        ],
      },
    ];
  };

  async function handleRefresh() {
    setRefreshing(true);
    setError("");
    try {
      const res = await fetch(`/api/payments/${orderId}/refresh`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? t("common.error"));
        return;
      }
      router.refresh();
    } catch {
      setError(t("common.error"));
    } finally {
      setRefreshing(false);
    }
  }

  async function handleCheckStatus() {
    setChecking(true);
    try {
      const res = await fetch(`/api/payments/${orderId}/status`);
      const json = await res.json();
      const data = json.data ?? json;
      if (data.status === "PAID") {
        // Server component re-render → status order/payment terbaru
        router.refresh();
      }
    } catch {
      // silent — user bisa coba lagi
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Header — judul + countdown besar */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
        <h3 className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-muted min-w-0 leading-snug">
          {t("checkout.completePayment")}
        </h3>
        {!countdown.expired && payment.expiresAt && (
          <div className="text-right shrink-0">
            <p className="text-lg sm:text-xl font-bold font-mono text-foreground tabular-nums leading-none">
              {countdown.formatted}
            </p>
            <p className="text-[11px] text-muted mt-1 whitespace-nowrap">{t("payment.timeRemaining")}</p>
          </div>
        )}
      </div>

      {/* Body — VA / QRIS */}
      <div className="p-5">
        {isQris && payment.paymentUrl ? (
          <div className="text-center space-y-4">
            <div className="flex items-center gap-2 justify-center">
              <span className="text-xs font-semibold tracking-widest uppercase text-muted">QRIS</span>
              <span className="text-xs text-muted">—</span>
              <span className="text-xs text-muted">{t("payment.qrisCode")}</span>
            </div>
            <div className="bg-white border border-border rounded-lg p-4 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={payment.paymentUrl}
                alt={t("payment.qrisAlt")}
                className="w-48 h-48 object-contain mx-auto"
              />
            </div>
            <p className="text-xs text-muted">
              {t("payment.expiresIn")} <span className="font-semibold text-warning">{countdown.formatted}</span>
            </p>
          </div>
        ) : payment.vaNumber ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {bankMethod?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bankMethod.logoUrl} alt={bankMethod.displayName} className="h-7 object-contain" />
              ) : (
                <div className="w-10 h-7 bg-accent rounded flex items-center justify-center">
                  <span className="text-[9px] font-bold text-muted">{payment.vaBank}</span>
                </div>
              )}
              <div>
                <p className="text-xs text-muted">{t("payment.toBank")}</p>
                <p className="text-sm font-semibold">{bankMethod?.displayName || payment.vaBank}</p>
                <p className="text-xs text-muted">Virtual Account</p>
              </div>
            </div>

            <div className="bg-accent rounded-lg p-4 space-y-1">
              <p className="text-xs text-muted">{t("payment.vaNumber")}</p>
              <div className="flex items-center gap-2 min-w-0">
                <p className="flex-1 min-w-0 text-lg sm:text-xl font-bold font-mono tracking-widest select-all truncate">
                  {payment.vaNumber}
                </p>
                <CopyBtn text={payment.vaNumber} label={t("payment.copyVA")} iconOnly />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-muted shrink-0">{t("payment.accountName")}</span>
              <span className="font-medium truncate text-right">{accountName ?? "—"}</span>
            </div>

            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-muted shrink-0">{t("payment.totalPayment")}</span>
              <span className="font-semibold text-right">{formatPrice(payableAmount, "IDR", locale)}</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Info box — jangan bagikan kode */}
      <div className="px-5 pb-5">
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
      </div>

      {/* Instruksi pembayaran */}
      <div className="px-5 pb-5 space-y-2">
        <p className="text-xs font-semibold tracking-widest uppercase text-muted px-1">
          {t("payment.paymentInstructions")}
        </p>
        <PaymentAccordion items={steps()} />
      </div>

      {/* Footer — cek pembayaran / expired */}
      <div className="px-5 pb-5 text-center space-y-2">
        {countdown.expired ? (
          <>
            <p className="text-xs text-destructive">{t("payment.expired")}</p>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button variant="secondary" size="sm" onClick={handleRefresh} loading={refreshing}>
              {t("account.refreshPayment")}
            </Button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={checking}
            className="text-xs text-primary hover:underline font-medium disabled:opacity-40"
          >
            {checking ? t("payment.checking") : t("payment.checkPayment")}
          </button>
        )}
      </div>
    </div>
  );
}
