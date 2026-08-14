"use client";

import { useEffect, useState } from "react";

interface CountdownResult {
  minutes: number;
  seconds: number;
  expired: boolean;
  formatted: string;
}

export function useCountdown(expiresAt: string | null | undefined): CountdownResult {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!expiresAt || now === null) {
    return { minutes: 0, seconds: 0, expired: false, formatted: "--:--" };
  }

  const diff = new Date(expiresAt).getTime() - now;
  if (diff <= 0) {
    return { minutes: 0, seconds: 0, expired: true, formatted: "00:00" };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return {
    minutes,
    seconds,
    expired: false,
    formatted: `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
  };
}
