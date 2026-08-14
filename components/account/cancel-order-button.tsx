"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

interface CancelOrderButtonProps {
  orderId: string;
  compact?: boolean;
}

// Tombol batalkan pesanan (status PENDING): klik → modal konfirmasi →
// POST /api/orders/:id/cancel → status order jadi CANCELLED + stok dikembalikan.
export function CancelOrderButton({ orderId, compact = false }: CancelOrderButtonProps) {
  const router = useRouter();
  const { t } = useI18n();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function handleCancel() {
    if (cancelling) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        toast(json.message ?? t("common.error"), { variant: "error" });
        return;
      }
      setDialogOpen(false);
      toast(t("account.orderCancelled"), { variant: "success" });
      router.refresh();
    } catch {
      toast(t("common.error"), { variant: "error" });
    } finally {
      setCancelling(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className={cn(
          "text-xs font-medium text-destructive transition-colors",
          compact
            ? "hover:underline py-1"
            : "border border-destructive/30 rounded-lg px-4 py-2.5 hover:bg-destructive/5"
        )}
      >
        {t("payment.cancelOrder")}
      </button>

      <ConfirmDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={t("payment.cancelOrder")}
        message={t("payment.cancelConfirm")}
        confirmLabel={t("payment.cancelOrder")}
        danger
        loading={cancelling}
        onConfirm={handleCancel}
      />
    </>
  );
}
