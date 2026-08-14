import { create } from "zustand";

interface AuthModalStore {
  isOpen: boolean;
  tab: "login" | "register";
  callbackFn: (() => void) | null;
  open: (tab?: "login" | "register", callback?: () => void) => void;
  close: () => void;
  switchTab: (tab: "login" | "register") => void;
}

export const useAuthModal = create<AuthModalStore>((set) => ({
  isOpen: false,
  tab: "login",
  callbackFn: null,
  open: (tab = "login", callback) =>
    set({ isOpen: true, tab, callbackFn: callback ?? null }),
  close: () => set({ isOpen: false, callbackFn: null }),
  switchTab: (tab) => set({ tab }),
}));
