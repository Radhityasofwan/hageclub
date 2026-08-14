"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface FilterChip {
  key: string;
  label: string;
}

interface OrderFilterChipsProps {
  filters: FilterChip[];
  activeKey: string;
}

// Chip filter status yang bisa digeser horizontal (full-bleed di HP):
// scrollbar disembunyikan, panah kecil muncul di tepi kanan saat masih
// ada chip terpotong dan menghilang saat sudah di ujung.
export function OrderFilterChips({ filters, activeKey }: OrderFilterChipsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showArrow, setShowArrow] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      const scrollable = el.scrollWidth > el.clientWidth + 8;
      const notAtEnd = el.scrollLeft + el.clientWidth < el.scrollWidth - 24;
      setShowArrow(scrollable && notAtEnd);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      ro.disconnect();
    };
  }, [filters]);

  return (
    <div className="relative -mx-4 px-4">
      <div
        ref={scrollRef}
        className="flex gap-2.5 overflow-x-auto no-scrollbar scroll-smooth pb-1 md:flex-wrap md:overflow-visible md:pb-1.5"
      >
        {filters.map((f) => (
          <Link
            key={f.key}
            href={f.key ? `/account/orders?status=${f.key}` : "/account/orders"}
            className={cn(
              "shrink-0 px-4 py-2 text-xs font-medium rounded-full border transition-colors",
              f.key === activeKey
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-white text-muted border-border hover:border-primary/40 hover:text-primary"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Fade + panah kecil — petunjuk masih bisa digeser */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 w-10 flex items-center justify-end pr-0.5 bg-gradient-to-l from-background to-transparent transition-opacity duration-200",
          showArrow ? "opacity-100" : "opacity-0"
        )}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className="text-muted/80"
        >
          <path
            d="M4.5 2.5L7.5 6l-3 3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
