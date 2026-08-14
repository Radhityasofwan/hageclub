"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

interface AskProductSheetProps {
  isOpen: boolean;
  onClose: () => void;
  waNumber?: string | null;
}

const EXIT_MS = 350;

export function AskProductSheet({ isOpen, onClose, waNumber }: AskProductSheetProps) {
  const { t } = useI18n();
  const [leaving, setLeaving] = useState(false);
  const [message, setMessage] = useState("");

  const visible = isOpen || leaving;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  function handleClose() {
    if (leaving) return;
    setLeaving(true);
    setTimeout(() => {
      onClose();
      setLeaving(false);
      setMessage("");
    }, EXIT_MS);
  }

  function handleSend() {
    if (!waNumber) return;
    const text = message.trim() || t("product.askDefaultMessage");
    const url = `https://wa.me/${waNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    handleClose();
  }

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300",
          isOpen && !leaving ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={handleClose}
      />

      {/* Sheet — mobile: slide dari bawah; sm+: dialog centered */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("product.askSheetTitle")}
        className={cn(
          "fixed inset-0 z-[60] flex items-end sm:items-center sm:justify-center sm:p-4 pointer-events-none"
        )}
      >
        <div
          className={cn(
            "relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-lg shadow-2xl flex flex-col max-h-[90vh]",
            "pointer-events-auto sheet-transition",
            isOpen && !leaving
              ? "translate-y-0 opacity-100"
              : "max-sm:translate-y-full sm:translate-y-2 sm:opacity-0"
          )}
        >
          {/* Handle bar — mobile */}
          <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
            <div className="w-10 h-1 rounded-full bg-neutral-300" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-1 sm:pt-4 pb-3 border-b border-border shrink-0">
            <h2 className="text-base font-semibold">{t("product.askSheetTitle")}</h2>
            <button
              type="button"
              onClick={handleClose}
              aria-label={t("common.close")}
              className="p-1.5 rounded text-muted hover:text-primary hover:bg-accent transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4 overflow-y-auto flex-1 space-y-4">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("product.askPlaceholder")}
              rows={4}
              autoFocus
              className="w-full min-h-[120px] border border-border rounded-sm px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary bg-white"
            />
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleSend}
              leadingIcon={<WaIcon size={16} />}
            >
              {t("product.askSend")}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function WaIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
