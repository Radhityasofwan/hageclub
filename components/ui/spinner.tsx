"use client";

import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

export interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-3.5 h-3.5 border-[1.5px]",
  md: "w-5 h-5 border-2",
  lg: "w-7 h-7 border-2",
};

export function Spinner({ size = "md", className }: SpinnerProps) {
  const { t } = useI18n();
  return (
    <span
      role="status"
      aria-label={t("common.loading")}
      className={cn(
        "inline-block rounded-full border-current border-r-transparent animate-spin",
        sizeClasses[size],
        className
      )}
    />
  );
}
