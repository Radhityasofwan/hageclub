"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isValidLocale, type Locale } from "./config";
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

function readLocaleCookie(): Locale | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
  const raw = match?.[1] ?? "";
  return isValidLocale(raw) ? raw : null;
}

interface I18nProviderProps {
  children: React.ReactNode;
  /** Locale from the server (default locale used for CDN-cached HTML). Client corrects from cookie on mount. */
  locale: Locale;
}

export function I18nProvider({ children, locale: serverLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(serverLocale);

  // Hydrate locale from cookie after mount — corrects cases where CDN served
  // the default locale but the user's cookie says otherwise (e.g. EN users).
  useEffect(() => {
    const cookieLocale = readLocaleCookie();
    if (cookieLocale && cookieLocale !== locale) {
      setLocaleState(cookieLocale);
      // Keep html[lang] in sync
      document.documentElement.lang = cookieLocale;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleCookie(l);
    setLocaleState(l);
    document.documentElement.lang = l;
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

/** Renders a single translated string inside a server component tree.
 *  Use this to avoid calling getI18n() in server components that could otherwise be ISR. */
export { I18nContext };
