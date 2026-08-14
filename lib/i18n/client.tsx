"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { type Locale } from "./config";
import { translate } from "./dictionary";
import idDict from "@/messages/id.json";
import enDict from "@/messages/en.json";

const dictionaries = { id: idDict, en: enDict } as const;

export type TFunction = (key: string, params?: Record<string, string | number>) => string;

interface I18nContextValue {
  t: TFunction;
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function setLocaleCookie(locale: Locale) {
  document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000;SameSite=Lax`;
}

interface I18nProviderProps {
  children: React.ReactNode;
  locale: Locale;
}

export function I18nProvider({ children, locale: initialLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleCookie(l);
    setLocaleState(l);
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const dict = dictionaries[locale];
    return {
      t: (key, params) => translate(dict, key, params),
      locale,
      setLocale,
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
}
