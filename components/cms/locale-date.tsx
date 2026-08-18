"use client";

import { useI18n } from "@/lib/i18n/client";
import { formatDate } from "@/lib/utils";

interface Props {
  date: Date | string;
  labelKey?: string;
  className?: string;
}

/** Renders "{t(labelKey)} {formatDate(date, locale)}" client-side.
 *  Avoids calling getI18n() in server components, enabling ISR for CMS pages. */
export function LocaleDate({ date, labelKey = "policy.lastUpdated", className }: Props) {
  const { t, locale } = useI18n();
  return (
    <span className={className}>
      {t(labelKey)} {formatDate(new Date(date), undefined, locale)}
    </span>
  );
}
