"use client";

import { useEffect, useRef } from "react";
import { useUiStore } from "@/stores/ui-store";
import { useI18n } from "@/lib/i18n/client";

interface AnnouncementBarProps {
  text: string;
  /** Durasi tampil dalam detik; notifikasi otomatis hilang setelahnya jika tidak ditutup */
  duration?: number;
}

const ENTER_DELAY_MS = 500;
const EXIT_MS = 550;

export function AnnouncementBar({ text, duration = 7 }: AnnouncementBarProps) {
  const { t } = useI18n();
  const {
    announcementVisible,
    announcementClosing,
    announcementEntered,
    setAnnouncementEntered,
    startAnnouncementClose,
    dismissAnnouncement,
  } = useUiStore();
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Delay masuk yang elegan — bar masuk beberapa saat setelah halaman terload.
  // State disimpan di store agar header & konten bergerak turun bersamaan.
  useEffect(() => {
    const t = setTimeout(() => setAnnouncementEntered(true), ENTER_DELAY_MS);
    return () => clearTimeout(t);
  }, [setAnnouncementEntered]);

  // Auto-hide: hilang sendiri setelah durasi jika customer tidak menutupnya
  useEffect(() => {
    if (!announcementEntered || !announcementVisible || duration <= 0) return;
    hideTimer.current = setTimeout(startHide, duration * 1000);
    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announcementEntered, announcementVisible, duration]);

  function startHide() {
    if (announcementClosing) return;
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    // Header & konten mendengar flag closing — seluruh halaman naik bersamaan
    startAnnouncementClose();
    setTimeout(dismissAnnouncement, EXIT_MS);
  }

  const visible = announcementEntered && announcementVisible && !announcementClosing;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-9 overflow-hidden will-change-transform"
      style={{
        transform: visible ? "translateY(0)" : "translateY(-100%)",
        opacity: visible ? 1 : 0,
        transition:
          "transform 0.55s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease",
        pointerEvents: visible ? "auto" : "none",
      }}
      aria-hidden={!visible}
    >
      {/* Dark base */}
      <div className="absolute inset-0 bg-primary" />

      {/* Shimmer sweep overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(90deg, transparent 0%, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%, transparent 100%)",
          backgroundSize: "300% 100%",
          animation: "announcement-shimmer 5s linear infinite",
        }}
      />

      {/* Content */}
      <div className="relative h-full flex items-center justify-center px-10 gap-2.5 text-white select-none">
        {/* Truck icon */}
        <span
          className="shrink-0"
          style={{ animation: "announcement-icon 3.5s ease-in-out infinite" }}
        >
          <svg
            width="15"
            height="12"
            viewBox="0 0 15 12"
            fill="none"
            aria-hidden="true"
          >
            <rect x="0.75" y="0.75" width="8.5" height="7.5" rx="0.75" stroke="currentColor" strokeWidth="1.2" />
            <path d="M9.25 3h3l2 3v2.25H9.25V3Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            <circle cx="3.25" cy="10.25" r="1.25" fill="currentColor" />
            <circle cx="11.25" cy="10.25" r="1.25" fill="currentColor" />
          </svg>
        </span>

        {/* Animated separator dot */}
        <span
          className="w-1 h-1 rounded-full bg-white/40 shrink-0"
          style={{ animation: "announcement-dot 2.5s ease-in-out infinite" }}
        />

        {/* Message */}
        <p className="text-xs tracking-wide font-normal text-white/90 whitespace-nowrap overflow-hidden text-ellipsis max-w-[80vw]">
          {text}
        </p>

        {/* Close */}
        <button
          onClick={startHide}
          aria-label={t("announcement.close")}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M8 2L2 8M2 2l6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
