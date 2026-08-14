export interface CheckoutCustomer {
  name: string;
  email: string;
  phone: string;
}

export interface CheckoutAddress {
  recipientName: string;
  phone: string;
  street: string;
  district: string;
  city: string;
  cityId: string;
  province: string;
  provinceId: string;
  postalCode: string;
  /** ID wilayah tujuan dari RajaOngkir V2 (district/subdistrict) — wajib untuk hitung ongkir */
  locationId: string;
  /** Label lengkap wilayah tujuan (dari hasil pencarian) */
  locationLabel?: string;
}

export type PaymentMethodOption = "VA" | "QRIS";

/** Hanya metode yang didukung arsitektur pembayaran (Komerce Payment + QRISLY) */
export const PAYMENT_METHODS: PaymentMethodOption[] = ["VA", "QRIS"];
