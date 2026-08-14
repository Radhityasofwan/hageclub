import { create } from "zustand";

interface PromoStore {
  isDismissed: (promoId: string, cooldownMs?: number) => boolean;
  dismiss: (promoId: string) => void;
  claimedCode: string | null;
  setClaimed: (code: string) => void;
  clearClaimed: () => void;
}

const PREFIX = "promo_dismissed_";
const EXPIRE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function safeGet(key: string): string | null {
  try { return typeof window !== "undefined" ? localStorage.getItem(key) : null; }
  catch { return null; }
}

function safeSet(key: string, value: string) {
  try { if (typeof window !== "undefined") localStorage.setItem(key, value); }
  catch { /* private browsing / quota */ }
}

export const usePromoStore = create<PromoStore>(() => ({
  isDismissed: (promoId: string, cooldownMs?: number) => {
    const raw = safeGet(`${PREFIX}${promoId}`);
    if (!raw) return false;
    const ts = Number(raw);
    if (isNaN(ts)) return false;
    return Date.now() - ts < (cooldownMs ?? EXPIRE_MS);
  },
  dismiss: (promoId: string) => {
    safeSet(`${PREFIX}${promoId}`, String(Date.now()));
    usePromoStore.setState({});
  },
  claimedCode: null,
  setClaimed: (code) => usePromoStore.setState({ claimedCode: code }),
  clearClaimed: () => usePromoStore.setState({ claimedCode: null }),
}));
