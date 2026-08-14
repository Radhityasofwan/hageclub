import { cn } from "@/lib/utils";

const PAYMENT_METHODS = [
  "QRIS", "OVO", "Akulaku", "Alfamart", "Mandiri", "BRI", "BNI",
] as const;

const SHIPPING_METHODS = [
  "J&T Express", "SiCepat", "JNE",
] as const;

function AccordionItem({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group border-b border-border last:border-b-0">
      <summary className="flex items-center justify-between py-3 text-sm font-medium cursor-pointer select-none list-none">
        <span>{title}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="shrink-0 transition-transform duration-200 group-open:rotate-180"
          aria-hidden="true"
        >
          <path
            d="M2.5 5l4.5 4 4.5-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>
      <div className="pb-4 pt-1">{children}</div>
    </details>
  );
}

interface PaymentShippingAccordionProps {
  className?: string;
}

export function PaymentShippingAccordion({ className }: PaymentShippingAccordionProps) {
  return (
    <div className={cn("border border-border rounded-sm divide-y divide-border", className)}>
      <AccordionItem title="Metode Pembayaran">
        <div className="flex flex-wrap gap-1.5">
          {PAYMENT_METHODS.map((method) => (
            <span
              key={method}
              className="inline-flex items-center px-2.5 py-1 text-xs font-medium border border-border rounded-sm bg-accent/40"
            >
              {method}
            </span>
          ))}
        </div>
      </AccordionItem>

      <AccordionItem title="Metode Pengiriman">
        <div className="flex flex-wrap gap-1.5">
          {SHIPPING_METHODS.map((courier) => (
            <span
              key={courier}
              className="inline-flex items-center px-2.5 py-1 text-xs font-medium border border-border rounded-sm bg-accent/40"
            >
              {courier}
            </span>
          ))}
        </div>
        <p className="mt-2.5 text-xs text-muted leading-relaxed">
          Dikirim dalam 48 jam setelah pembayaran dikonfirmasi.
        </p>
      </AccordionItem>
    </div>
  );
}
