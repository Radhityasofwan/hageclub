"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface PaymentStatusData {
  status: string;
  method: string;
  amount: number;
  vaNumber?: string | null;
  paymentUrl?: string | null;
  paidAt?: string | null;
  expiresAt?: string | null;
  orderStatus?: string;
}

export function usePaymentStatus(orderId: string | null) {
  const [data, setData] = useState<PaymentStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/payments/${orderId}/status`);
      const json = await res.json();
      const d = json.data ?? json;
      setData(d);

      if (d.status === "PAID") {
        setConfirmed(true);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Initial fetch
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Poll every 10 seconds while pending
  useEffect(() => {
    if (confirmed || !orderId) return;

    intervalRef.current = setInterval(fetchStatus, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [orderId, confirmed, fetchStatus]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchStatus();
  }, [fetchStatus]);

  return { data, loading, confirmed, refresh };
}
