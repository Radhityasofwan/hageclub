"use client";

import { createContext, useContext } from "react";

interface StoreSettings {
  freeShippingThreshold: number;
  freeShippingRegions: string[];
}

const StoreSettingsContext = createContext<StoreSettings>({
  freeShippingThreshold: 500_000,
  freeShippingRegions: [],
});

export function StoreSettingsProvider({
  children,
  freeShippingThreshold,
  freeShippingRegions,
}: {
  children: React.ReactNode;
  freeShippingThreshold: number;
  freeShippingRegions: string[];
}) {
  return (
    <StoreSettingsContext.Provider value={{ freeShippingThreshold, freeShippingRegions }}>
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  return useContext(StoreSettingsContext);
}
