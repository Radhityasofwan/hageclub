import { create } from "zustand";

interface ShippingModalState {
  isOpen: boolean;
  openShippingModal: () => void;
  closeShippingModal: () => void;
}

/** Status modal Cek Ongkir — dipakai halaman lain (mis. sticky bar mobile)
 *  untuk menyembunyikan tombol floating agar tidak tumpang tindih. */
export const useShippingModalStore = create<ShippingModalState>((set) => ({
  isOpen: false,
  openShippingModal: () => set({ isOpen: true }),
  closeShippingModal: () => set({ isOpen: false }),
}));
