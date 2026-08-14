"use client";

import { useState } from "react";

export interface AccordionItem {
  id: string;
  label: string;
  steps: string[];
}

/** Accordion instruksi pembayaran — satu item terbuka dalam satu waktu */
export function PaymentAccordion({ items }: { items: AccordionItem[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
      {items.map((item) => {
        const isOpen = open === item.id;
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : item.id)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-medium hover:bg-accent/50 transition-colors text-left"
            >
              <span>{item.label}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className={`shrink-0 transition-transform duration-200 text-muted ${isOpen ? "rotate-180" : ""}`}
              >
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 pt-2 space-y-2">
                {item.steps.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-xs text-muted leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
