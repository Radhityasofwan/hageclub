"use client";

import { useState } from "react";

export interface FaqAccordionItem {
  question: string;
  answer: string;
}

export function FaqAccordionList({ items }: { items: FaqAccordionItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {items.map((faq, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i} className="border border-border rounded overflow-hidden">
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 bg-white hover:bg-accent/30 transition-colors"
            >
              <span className="text-sm font-medium">{faq.question}</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className={`transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`}
              >
                <path d="M2 4L6 8L10 4" />
              </svg>
            </button>
            {isOpen && (
              <div className="px-5 py-4 border-t border-border bg-accent/20">
                <p className="text-sm text-muted leading-relaxed">{faq.answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
