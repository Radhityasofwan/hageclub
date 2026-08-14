import "server-only";
import { headers } from "next/headers";
import { resolveLocale, type Locale } from "./config";
import { translate } from "./dictionary";
import idDict from "@/messages/id.json";
import enDict from "@/messages/en.json";

const dictionaries = { id: idDict, en: enDict } as const;

export type TFunction = (key: string, params?: Record<string, string | number>) => string;

interface I18nResult {
  t: TFunction;
  locale: Locale;
}

export async function getI18n(): Promise<I18nResult> {
  const headersList = await headers();
  const rawLocale = headersList.get("x-locale") ?? "";
  const locale = resolveLocale(rawLocale);
  const dict = dictionaries[locale];

  const t: TFunction = (key, params) => translate(dict, key, params);

  return { t, locale };
}

export async function getLocale(): Promise<Locale> {
  const headersList = await headers();
  const rawLocale = headersList.get("x-locale") ?? "";
  return resolveLocale(rawLocale);
}
