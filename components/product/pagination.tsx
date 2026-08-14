"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/client";

interface PaginationProps {
  page: number;
  totalPages: number;
  className?: string;
}

export function Pagination({ page, totalPages, className }: PaginationProps) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`, { scroll: true });
  }

  const pages = buildPageNumbers(page, totalPages);

  return (
    <nav
      aria-label={t("pagination.label")}
      className={cn("flex items-center justify-center gap-1", className)}
    >
      {/* Prev */}
      <PaginationButton
        onClick={() => goToPage(page - 1)}
        disabled={page <= 1}
        aria-label={t("pagination.previous")}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M10 12L6 8L10 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </PaginationButton>

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === "…" ? (
          <span
            key={`ellipsis-${i}`}
            className="w-9 h-9 flex items-center justify-center text-sm text-muted"
          >
            …
          </span>
        ) : (
          <PaginationButton
            key={p}
            onClick={() => goToPage(p as number)}
            active={p === page}
            aria-label={t("pagination.page", { page: p as number })}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </PaginationButton>
        )
      )}

      {/* Next */}
      <PaginationButton
        onClick={() => goToPage(page + 1)}
        disabled={page >= totalPages}
        aria-label={t("pagination.next")}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M6 4L10 8L6 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </PaginationButton>
    </nav>
  );
}

function PaginationButton({
  children,
  active,
  disabled,
  onClick,
  ...props
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-9 h-9 flex items-center justify-center text-sm rounded-sm transition-colors",
        active
          ? "bg-primary text-white font-medium"
          : "text-primary hover:bg-accent disabled:text-muted disabled:cursor-not-allowed"
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function buildPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "…")[] = [];

  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, "…", total);
  } else if (current >= total - 3) {
    pages.push(1, "…", total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, "…", current - 1, current, current + 1, "…", total);
  }

  return pages;
}
