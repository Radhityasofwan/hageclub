import { create } from "zustand";

interface UiState {
  mobileMenuOpen: boolean;
  searchOpen: boolean;
  announcementVisible: boolean;
  /** Sedang dalam animasi menutup — header & konten ikut bergerak naik */
  announcementClosing: boolean;
  /** Delay masuk selesai — bar sudah tampil, header terdorong turun */
  announcementEntered: boolean;
}

interface UiActions {
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleSearch: () => void;
  closeSearch: () => void;
  setAnnouncementEntered: (entered: boolean) => void;
  startAnnouncementClose: () => void;
  dismissAnnouncement: () => void;
}

type UiStore = UiState & UiActions;

export const useUiStore = create<UiStore>()((set) => ({
  mobileMenuOpen: false,
  searchOpen: false,
  announcementVisible: true,
  announcementClosing: false,
  announcementEntered: false,

  toggleMobileMenu: () =>
    set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
  closeMobileMenu: () => set({ mobileMenuOpen: false }),

  toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),
  closeSearch: () => set({ searchOpen: false }),

  setAnnouncementEntered: (entered) => set({ announcementEntered: entered }),
  startAnnouncementClose: () => set({ announcementClosing: true }),
  dismissAnnouncement: () =>
    set({
      announcementVisible: false,
      announcementClosing: false,
      announcementEntered: false,
    }),
}));
