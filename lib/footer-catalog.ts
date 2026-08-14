// Katalog metode pembayaran & ekspedisi untuk kolom Payment & Shipping di footer.
// Modul ini bebas efek samping (tanpa DB/Prisma) agar aman diimpor dari
// server components (footer publik) maupun client components (form admin).
//
// `color` dipakai untuk chip fallback saat metode belum punya logo yang diupload —
// dipilih agar tetap terbaca di atas latar primary gelap (#1C1C1E).

export interface FooterPaymentMethod {
  id: string;
  label: string;
  color: string;
}

export const PAYMENT_METHODS: FooterPaymentMethod[] = [
  { id: "qris",       label: "QRIS",       color: "#3B82F6" },
  { id: "ovo",        label: "OVO",        color: "#4C249F" },
  { id: "shopeepay",  label: "ShopeePay",  color: "#EE4D2D" },
  { id: "akulaku",    label: "Akulaku",    color: "#1B6BFF" },
  { id: "alfamart",   label: "Alfamart",   color: "#ED1C24" },
  { id: "mandiri",    label: "Mandiri",    color: "#4D8FD6" },
  { id: "bri",        label: "BRI",        color: "#3B82C4" },
  { id: "bni",        label: "BNI",        color: "#F47B20" },
  { id: "permata",    label: "Permata",    color: "#3E8EDB" },
  { id: "danamon",    label: "Danamon",    color: "#5AA0E8" },
  { id: "bsi",        label: "BSI",        color: "#00A85D" },
  { id: "cimb",       label: "CIMB",       color: "#F38600" },
  { id: "visa",       label: "Visa",       color: "#7A86E8" },
  { id: "mastercard", label: "Mastercard", color: "#F2484F" },
  { id: "jcb",        label: "JCB",        color: "#3D7AD8" },
];

export const SHIPPING_COURIERS: FooterPaymentMethod[] = [
  { id: "jnt",      label: "J&T",      color: "#E42313" },
  { id: "jne",      label: "JNE",      color: "#F37021" },
  { id: "sicepat",  label: "SiCepat",  color: "#1F9CF0" },
  { id: "ninja",    label: "Ninja",    color: "#FF7A00" },
  { id: "anteraja", label: "AnterAja", color: "#00A0E9" },
];

export function getPaymentMethod(id: string): FooterPaymentMethod | undefined {
  return PAYMENT_METHODS.find((m) => m.id === id);
}

export function getShippingCourier(id: string): FooterPaymentMethod | undefined {
  return SHIPPING_COURIERS.find((c) => c.id === id);
}
