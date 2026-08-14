"use client";

import { createPortal } from "react-dom";
import { useSheetExit } from "@/hooks/use-sheet-exit";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
}

// Modal konfirmasi aksi destruktif (batalkan pesanan, hapus alamat, dll) —
// bottom sheet di HP, dialog kecil di tengah di web, animasi konsisten
// dengan sheet premium lainnya.
export function ConfirmDialog({
  open,
  onClose,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = true,
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const { t } = useI18n();
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
          "relative mt-auto bg-white flex flex-col rounded-t-2xl overflow-hidden sm:m-auto sm:rounded-xl sm:w-full sm:max-w-sm sheet-transition",
          open && !leaving
            ? "translate-y-0 opacity-100"
            : "max-sm:translate-y-full sm:translate-y-2 sm:opacity-0"
        )}
      >
        {/* Handle bar — HP */}
        <div className="flex justify-center pt-3 pb-1 shrink-0 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Body */}
        <div className="px-5 pt-2 pb-5">
          <h2 className="text-base font-bold">{title}</h2>
          <p className="text-sm text-muted mt-2 leading-relaxed">{message}</p>

          <div className="flex gap-2.5 mt-5">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 h-11 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-colors"
            >
              {cancelLabel ?? t("account.cancel")}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={cn(
                "flex-1 h-11 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50",
                danger ? "bg-destructive" : "bg-primary"
              )}
            >
              {loading ? t("common.loading") : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
