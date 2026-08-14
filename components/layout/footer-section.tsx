"use client";

import { useState } from "react";

interface FooterSectionProps {
  heading: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

/**
 * Section footer responsive: accordion di mobile (< md), heading statis + konten
 * selalu tampil di desktop (md+). Pattern progressive disclosure — dokumen
 * gaya-footer-terbaru.
 */
export function FooterSection({ heading, children, defaultOpen = false }: FooterSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/10 md:border-0">
      {/* Mobile: heading = tombol toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="md:hidden flex w-full items-center justify-between py-3 text-left text-xs font-semibold tracking-widest uppercase text-white/60 hover:text-white transition-colors"
      >
        {heading}
        <svg
          viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
          className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Desktop: heading statis */}
      <h3 className="hidden md:block mb-3 text-xs font-semibold tracking-widest uppercase text-white/40">
        {heading}
      </h3>

      <div className={`${open ? "block" : "hidden"} pb-3 md:block md:pb-0`}>
        {children}
      </div>
    </div>
  );
}
