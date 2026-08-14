"use client";

import { useEffect, useState, useMemo } from "react";
import { useI18n } from "@/lib/i18n/client";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(endDate: Date): TimeLeft | null {
  const diff = endDate.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

/**
 * variant: "light" = teks putih (latar gelap, mis. featured full screen);
 * "dark" = teks gelap (latar terang, mis. grid putih).
 */
export function CountdownTimer({
  endDate: endDateStr,
  title,
  variant = "light",
}: {
  endDate: string;
  title?: string;
  variant?: "light" | "dark";
}) {
  const { t } = useI18n();
  const endDate = useMemo(() => new Date(endDateStr), [endDateStr]);
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setMounted(true);
    setTimeLeft(calcTimeLeft(endDate));

    const timer = setInterval(() => {
      const next = calcTimeLeft(endDate);
      setTimeLeft(next);
      if (!next) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  if (!mounted || !timeLeft) return null;

  const isDark = variant === "dark";

  const units = [
    { value: timeLeft.days, label: t("countdown.days") },
    { value: timeLeft.hours, label: t("countdown.hours") },
    { value: timeLeft.minutes, label: t("countdown.minutes") },
    { value: timeLeft.seconds, label: t("countdown.seconds") },
  ];

  return (
    <div className="text-center">
      {title && (
        <p
          className={`text-xs tracking-[0.2em] uppercase mb-3 ${
            isDark ? "text-primary/50" : "text-white/50"
          }`}
        >
          {title}
        </p>
      )}
      <div className="flex items-center justify-center gap-3 sm:gap-4">
        {units.map((unit) => (
          <div key={unit.label} className="flex flex-col items-center">
            <span
              className={`text-2xl sm:text-3xl font-bold tabular-nums leading-none ${
                isDark ? "text-primary" : "text-white"
              }`}
            >
              {String(unit.value).padStart(2, "0")}
            </span>
            <span
              className={`text-[10px] uppercase tracking-wider mt-1 ${
                isDark ? "text-muted" : "text-white/40"
              }`}
            >
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
