"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  message: string;
  duration: number;
  action?: { label: string; href: string };
}

interface ToastContextValue {
  toast: (message: string, options?: ToastOptions) => void;
}

interface ToastOptions {
  variant?: ToastVariant;
  duration?: number;
  action?: { label: string; href: string };
}

// =============================================================================
// CONTEXT
// =============================================================================

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// =============================================================================
// SINGLE TOAST ITEM
// =============================================================================

// Semua varian berbagi latar netral yang sama (pill putih/gelap); warna varian
// hanya tampil di ikon — minimalis & konsisten.
const variantConfig: Record<
  ToastVariant,
  { icon: React.ReactNode; color: string }
> = {
  success: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M3 8L6.5 11.5L13 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    color: "text-success",
  },
  error: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M4 4L12 12M12 4L4 12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    color: "text-destructive",
  },
  warning: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 3L14 13H2L8 3Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M8 7V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11" r="0.5" fill="currentColor" />
      </svg>
    ),
    color: "text-warning",
  },
  info: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 7V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="5.5" r="0.5" fill="currentColor" />
      </svg>
    ),
    color: "text-primary dark:text-white",
  },
};

function ToastItemEl({
  item,
  onRemove,
}: {
  item: ToastItem;
  onRemove: (id: string) => void;
}) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const config = variantConfig[item.variant];

  useEffect(() => {
    const show = requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(item.id), 300);
    }, item.duration);

    return () => {
      cancelAnimationFrame(show);
      clearTimeout(timer);
    };
  }, [item, onRemove]);

  return (
    <div
      role="alert"
      className={cn(
        "flex items-center gap-2.5 pl-4 pr-2 py-2 rounded-full shadow-lg",
        "bg-white border border-border/80 text-foreground",
        "dark:bg-neutral-900 dark:border-white/10 dark:text-white",
        "text-sm font-medium max-w-[min(24rem,calc(100vw-2rem))]",
        "transition-all duration-300",
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      )}
    >
      <span className={cn("shrink-0", config.color)}>{config.icon}</span>
      <span className="flex-1 min-w-0 leading-snug">{item.message}</span>
      {item.action && (
        <a
          href={item.action.href}
          className={cn(
            "shrink-0 text-xs font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity",
            config.color
          )}
        >
          {item.action.label}
        </a>
      )}
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => onRemove(item.id), 300);
        }}
        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-muted hover:text-foreground hover:bg-accent transition-colors"
        aria-label={t("common.close")}
      >
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
          <path
            d="M11 3L3 11M3 3L11 11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

// =============================================================================
// PROVIDER + TOASTER
// =============================================================================

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const item: ToastItem = {
        id: crypto.randomUUID(),
        variant: options.variant ?? "info",
        message,
        duration: options.duration ?? 3500,
        action: options.action,
      };
      setToasts((prev) => [...prev.slice(-4), item]);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {mounted &&
        createPortal(
          <div
            aria-live="polite"
            aria-atomic="false"
            className="fixed top-4 inset-x-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none"
          >
            {toasts.map((item) => (
              <div key={item.id} className="pointer-events-auto">
                <ToastItemEl item={item} onRemove={removeToast} />
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
