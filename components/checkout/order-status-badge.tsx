"use client";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/client";

const STATUS_COLORS: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  PENDING: "default",
  PAID: "info",
  PROCESSING: "warning",
  PACKED: "warning",
  SHIPPED: "info",
  DELIVERED: "success",
  COMPLETED: "success",
  CANCELLED: "danger",
  REFUNDED: "danger",
} as const;

export const STATUS_KEYS: Record<string, string> = {
  PENDING: "payment.statusPending",
  PAID: "payment.statusPaid",
  PROCESSING: "payment.statusProcessing",
  PACKED: "payment.statusPacked",
  SHIPPED: "payment.statusShipped",
  DELIVERED: "payment.statusDelivered",
  COMPLETED: "payment.statusCompleted",
  CANCELLED: "payment.statusCancelled",
  REFUNDED: "payment.statusRefunded",
};

interface OrderStatusBadgeProps {
  status: string;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const { t } = useI18n();

  return (
    <Badge variant={STATUS_COLORS[status] ?? "default"} className={className}>
      {t(STATUS_KEYS[status] ?? status)}
    </Badge>
  );
}
