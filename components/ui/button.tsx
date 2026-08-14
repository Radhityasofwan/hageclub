"use client";

import { forwardRef } from "react";
import { Spinner } from "./spinner";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-primary text-white hover:bg-primary/90 disabled:bg-primary/50 dark:bg-white dark:text-primary dark:hover:bg-white/90",
  secondary:
    "border border-primary text-primary hover:bg-primary hover:text-white disabled:opacity-50 dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-primary",
  ghost:
    "text-primary hover:bg-accent disabled:opacity-50 dark:text-white dark:hover:bg-white/10",
  danger:
    "bg-destructive text-white hover:bg-destructive/90 disabled:bg-destructive/50",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
};

const spinnerSizeMap: Record<
  NonNullable<ButtonProps["size"]>,
  "sm" | "md" | "lg"
> = {
  sm: "sm",
  md: "sm",
  lg: "md",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leadingIcon,
      trailingIcon,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium tracking-wide transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer disabled:cursor-not-allowed select-none",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <Spinner
            size={spinnerSizeMap[size]}
            className={variant === "primary" ? "text-white" : "text-current"}
          />
        ) : leadingIcon ? (
          <span className="shrink-0">{leadingIcon}</span>
        ) : null}
        {children && <span>{children}</span>}
        {!loading && trailingIcon && (
          <span className="shrink-0">{trailingIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
