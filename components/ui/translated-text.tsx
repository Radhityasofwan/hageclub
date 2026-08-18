"use client";

import { useI18n } from "@/lib/i18n/client";

interface Props {
  k: string;
  params?: Record<string, string | number>;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

/**
 * Renders a translated string inside a server component tree without requiring
 * getI18n() (which calls headers() and forces dynamic rendering).
 *
 * Usage: <TranslatedText k="faq.title" />
 */
export function TranslatedText({ k, params, as: Tag = "span", className }: Props) {
  const { t } = useI18n();
  if (className) {
    return <Tag className={className}>{t(k, params)}</Tag>;
  }
  return <>{t(k, params)}</>;
}
