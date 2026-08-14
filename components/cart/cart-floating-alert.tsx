"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/stores/cart-store";
import { useI18n } from "@/lib/i18n/client";
import { formatPrice, cn } from "@/lib/utils";
import {
  WhatsAppButton,
  type MessageTemplate,
} from "@/components/common/whatsapp-button";

interface Props {
  number: string | null;
  iconUrl?: string | null;
  templates?: MessageTemplate[];
  /** Link undangan grup WhatsApp (opsional) — ditampilkan di panel chat */
  groupUrl?: string | null;
}

/** Alert fixed di bawah kanan: pill keranjang + tombol WA compact di sebelah kanannya */
export function CartFloatingAlert({ number, iconUrl, templates, groupUrl }: Props) {
  const { t, locale } = useI18n();
  // Hanya homepage — dihitung di client agar reaktif saat navigasi client-side
  const isHome = usePathname() === "/";
  const [mounted, setMounted] = useState(false);
  const { items, totalPrice, openCart } = useCartStore();

  // Zustand persist rehydrates dari localStorage setelah hydration — defer render
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sembunyikan pill keranjang saat panel WhatsApp terbuka
  const [waOpen, setWaOpen] = useState(false);

  if (!isHome || !mounted || items.length === 0) return null;

  // Jumlah produk unik di keranjang (baris line-item), bukan total quantity
  const count = items.length;

  return (
    /* HP: bar keranjang mengisi lebar, FAB WA sebaris di kanan (sejajar vertikal).
       Desktop: pill keranjang + FAB WA berdampingan di pojok kanan bawah. */
    <div className="fixed bottom-5 right-5 z-40 flex items-center gap-3.5 max-sm:inset-x-4 max-sm:bottom-4">
      {/* Cart pill — hidden saat panel WhatsApp terbuka */}
      <button
        onClick={openCart}
        aria-label={t("cart.openCart")}
        className={cn(
          "flex items-center gap-3 h-11 pl-4 pr-5 rounded-lg bg-primary text-white shadow-lg hover:bg-primary/90 transition-colors max-sm:flex-1 max-sm:pl-4 max-sm:pr-4",
          waOpen && "invisible opacity-0 pointer-events-none scale-95"
        )}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
          aria-hidden="true"
        >
          <path d="M6.2 8h11.6l-1 9.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6.2 8Z" />
          <path d="M9 10.5V7a3 3 0 0 1 6 0v3.5" />
        </svg>
        <span className="text-left leading-tight">
          <span className="block text-[11px] font-bold text-white/70">
            {t(count === 1 ? "cart.alertItem" : "cart.alertItems", { count })}
          </span>
          <span className="block text-sm font-light tabular-nums text-white">
            {formatPrice(totalPrice(), "IDR", locale)}
          </span>
        </span>
      </button>

      {/* WhatsApp — compact, ikut posisi alert */}
      <WhatsAppButton
        number={number}
        iconUrl={iconUrl}
        templates={templates}
        groupUrl={groupUrl}
        compact
        containerClassName="flex flex-col items-end gap-3 shrink-0"
        onOpenChange={setWaOpen}
      />
    </div>
  );
}
