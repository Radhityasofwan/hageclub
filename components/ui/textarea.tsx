"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      containerClassName,
      className,
      id,
      rows = 4,
      maxLength,
      value,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;

    const charCount =
      typeof value === "string"
        ? value.length
        : typeof value === "number"
          ? String(value).length
          : 0;

    return (
      <div className={cn("w-full", containerClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-primary mb-1.5 dark:text-white"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          maxLength={maxLength}
          value={value}
          disabled={disabled}
          className={cn(
            "w-full border border-border rounded bg-white px-3 py-2.5 text-sm text-primary placeholder:text-muted resize-y",
            "focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary",
            "disabled:bg-accent disabled:text-muted disabled:cursor-not-allowed",
            "transition-colors dark:bg-primary dark:text-white dark:border-white/20 dark:placeholder:text-muted",
            error && "border-destructive focus:ring-destructive focus:border-destructive",
            className
          )}
          {...props}
        />
        <div className="flex justify-between mt-1">
          {error && (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
          {maxLength && (
            <p className="text-xs text-muted ml-auto">
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
