import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, CouponType } from "@/types";

export interface AppliedCoupon {
  code: string;
  type: CouponType;
  discount: number;
  message: string;
}

interface CartState {
  items: CartItem[];
  coupon: AppliedCoupon | null;
  isOpen: boolean;
  _hydrated: boolean;
}

interface CartActions {
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string | null) => void;
  updateQuantity: (
    productId: string,
    variantId: string | null | undefined,
    quantity: number
  ) => void;
  clearCart: () => void;
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setHydrated: () => void;
  // Computed
  totalItems: () => number;
  totalPrice: () => number;
  totalWeight: () => number;
  totalDiscount: () => number;
}

type CartStore = CartState & CartActions;

const isSameItem = (
  a: CartItem,
  b: { productId: string; variantId?: string | null }
) => a.productId === b.productId && (a.variantId ?? null) === (b.variantId ?? null);

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      isOpen: false,
      _hydrated: false,

      addItem: (item) => {
        set((state) => {
          // Produk/varian yang sudah ada di keranjang tidak ditambah lagi
          const existing = state.items.find((i) => isSameItem(i, item));
          if (existing) return {};
          return { items: [...state.items, item] };
        });
      },

      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !isSameItem(i, { productId, variantId })
          ),
        }));
      },

      updateQuantity: (productId, variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            isSameItem(i, { productId, variantId })
              ? { ...i, quantity: Math.min(quantity, i.stock) }
              : i
          ),
        }));
      },

      clearCart: () => set({ items: [], coupon: null }),

      applyCoupon: (coupon) => set({ coupon }),
      removeCoupon: () => set({ coupon: null }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      setHydrated: () => set({ _hydrated: true }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      totalWeight: () =>
        get().items.reduce((sum, i) => sum + i.weight * i.quantity, 0),

      totalDiscount: () => get().coupon?.discount ?? 0,
    }),
    {
      name: "hageclub-cart",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
