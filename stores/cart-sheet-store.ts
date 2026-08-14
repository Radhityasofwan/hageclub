import { create } from "zustand";
import type { CartItem } from "@/types";

interface CartSheetState {
  item: CartItem | null;
  isOpen: boolean;
  openSheet: (item: CartItem) => void;
  closeSheet: () => void;
}

/** Bottom sheet konfirmasi "produk berhasil ditambahkan" — mobile only */
export const useCartSheetStore = create<CartSheetState>((set) => ({
  item: null,
  isOpen: false,
  openSheet: (item) => set({ item, isOpen: true }),
  closeSheet: () => set({ isOpen: false }),
}));
