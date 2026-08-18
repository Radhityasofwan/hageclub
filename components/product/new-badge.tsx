"use client";

import { useI18n } from "@/lib/i18n/client";
import { Badge } from "@/components/ui/badge";

/** Client component so the product page server component doesn't need getI18n() → enables ISR. */
export function NewBadge() {
  const { t } = useI18n();
  return <Badge variant="info" size="sm">{t("product.newBadge")}</Badge>;
}
