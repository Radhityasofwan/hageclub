import { create } from "zustand";

export interface WishlistToggleResult {
  ok: boolean;
  added?: boolean;
  needsAuth?: boolean;
}

interface WishlistState {
  ids: string[];
  hydratedUserId: string | null;
  hydratingUserId: string | null;
}

interface WishlistActions {
  hydrate: (userId: string) => Promise<void>;
  toggle: (productId: string) => Promise<WishlistToggleResult>;
  reset: () => void;
}

type WishlistStore = WishlistState & WishlistActions;

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  ids: [],
  hydratedUserId: null,
  hydratingUserId: null,

  hydrate: async (userId) => {
    const { hydratedUserId, hydratingUserId } = get();
    if (hydratedUserId === userId || hydratingUserId === userId) return;
    set({ hydratingUserId: userId });
    try {
      const res = await fetch("/api/account/wishlist");
      if (!res.ok) return;
      const json = await res.json();
      const items: { product: { id: string } }[] = json.data ?? [];
      set({
        ids: items.map((i) => i.product.id),
        hydratedUserId: userId,
      });
    } catch {
      // keep current state; hydrate runs again on next session change
    } finally {
      set({ hydratingUserId: null });
    }
  },

  toggle: async (productId) => {
    const removing = get().ids.includes(productId);
    const res = removing
      ? await fetch(`/api/account/wishlist?productId=${productId}`, {
          method: "DELETE",
        })
      : await fetch("/api/account/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });

    if (res.status === 401) return { ok: false, needsAuth: true };
    if (!res.ok) return { ok: false, needsAuth: false };

    set((s) => ({
      ids: removing
        ? s.ids.filter((id) => id !== productId)
        : s.ids.includes(productId)
          ? s.ids
          : [...s.ids, productId],
    }));
    return { ok: true, added: !removing };
  },

  reset: () => set({ ids: [], hydratedUserId: null, hydratingUserId: null }),
}));
