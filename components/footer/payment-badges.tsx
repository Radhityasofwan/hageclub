import type { FooterPaymentMethod } from "@/lib/footer-catalog";

interface PaymentBadgeProps {
  method: FooterPaymentMethod;
  imageUrl?: string | null;
}

/** Chip logo metode pembayaran/ekspedisi: gambar upload admin, atau fallback teks warna brand. */
export function PaymentBadge({ method, imageUrl }: PaymentBadgeProps) {
  if (imageUrl) {
    return (
      <span className="inline-flex items-center rounded-sm bg-white px-2.5 py-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={method.label}
          className="h-5 w-auto object-contain"
          loading="lazy"
        />
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center rounded-sm border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide"
      style={{ color: method.color }}
    >
      {method.label}
    </span>
  );
}
