"use client";

import { formatDateTime } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/client";
import { STATUS_KEYS } from "./order-status-badge";

interface TimelineEntry {
  status: string;
  note?: string | null;
  createdAt: string | Date;
}

interface OrderTimelineProps {
  entries: TimelineEntry[];
  className?: string;
}

export function OrderTimeline({ entries, className = "" }: OrderTimelineProps) {
  const { t } = useI18n();

  if (!entries.length) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-sm font-semibold tracking-widest uppercase text-muted">
        {t("checkout.orderTimeline")}
      </h3>
      <div className="space-y-0">
        {entries.map((entry, idx) => {
          const isLatest = idx === entries.length - 1;
          return (
            <div key={idx} className="flex gap-3 pb-4 last:pb-0">
              <div className="flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full border-2 shrink-0 ${
                    isLatest
                      ? "bg-primary border-primary"
                      : "bg-accent border-muted"
                  }`}
                />
                {idx < entries.length - 1 && (
                  <div className="w-px flex-1 bg-border mt-1" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {STATUS_KEYS[entry.status]
                    ? t(STATUS_KEYS[entry.status])
                    : entry.status.replace(/_/g, " ")}
                </p>
                {entry.note && (
                  <p className="text-xs text-muted">{entry.note}</p>
                )}
                <p className="text-xs text-muted">{formatDateTime(entry.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
