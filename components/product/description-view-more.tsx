"use client";

import { useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { sanitizeDescription } from "@/lib/sanitize-description";

// Tinggi kolaps ≈ 5 baris teks (body 16px / line-height 1.6 → ±28px per baris)
const COLLAPSED_HEIGHT = 140;

// Konten admin: plaintext (baris baru) atau HTML sederhana. Plaintext ditransform
// jadi paragraf agar terstruktur; HTML dibiarkan apa adanya.
function formatDescription(html: string): string {
  if (/<[a-z][\s\S]*>/i.test(html)) return html;
  const paragraphs = html
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return paragraphs
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

interface DescriptionViewMoreProps {
  html: string;
}

export function DescriptionViewMore({ html }: DescriptionViewMoreProps) {
  const { t } = useI18n();
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [height, setHeight] = useState(COLLAPSED_HEIGHT);

  function toggle() {
    if (expanded) {
      setHeight(COLLAPSED_HEIGHT);
    } else {
      setHeight(contentRef.current?.scrollHeight ?? COLLAPSED_HEIGHT);
    }
    setExpanded((v) => !v);
  }

  return (
    <div>
      <div
        className="relative overflow-hidden"
        style={{ height, transition: "height 250ms ease" }}
      >
        <div
          ref={contentRef}
          className="description-content text-foreground"
          dangerouslySetInnerHTML={{ __html: sanitizeDescription(formatDescription(html)) }}
        />
        {/* Fade mask: potongan bawah memudar ke background, bukan terpotong kasar */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background via-background/70 to-transparent"
          style={{ opacity: expanded ? 0 : 1, transition: "opacity 250ms ease" }}
        />
      </div>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={expanded}
        className="mx-auto flex items-center gap-1.5 mt-3 text-xs font-medium text-foreground hover:opacity-70 transition-opacity"
      >
        {expanded ? t("product.viewLess") : t("product.viewMore")}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
          className={cn(
            "transition-transform duration-[250ms]",
            expanded && "rotate-180"
          )}
        >
          <path
            d="M2.5 4.5L6 8l3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
