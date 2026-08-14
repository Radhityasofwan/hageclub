// Client-safe constants untuk Komerce Payment API (api.collaborator.komerce.id/user)

export const KOMERCE_PAYMENT_ENVIRONMENTS = {
  sandbox: {
    label: "Sandbox (uji coba)",
    description: "Untuk testing — transaksi disimulasikan, tidak diproses bank.",
    baseUrl: "https://api-sandbox.collaborator.komerce.id/user/",
    payBaseUrl: "https://pay-sandbox.komerce.id/",
  },
  production: {
    label: "Production",
    description: "Pembayaran sungguhan. Wajib menggunakan API key production.",
    baseUrl: "https://api.collaborator.komerce.id/user/",
    payBaseUrl: "https://pay.komerce.id/",
  },
} as const;

export const DEFAULT_KOMERCE_PAYMENT_BASE_URL =
  KOMERCE_PAYMENT_ENVIRONMENTS.sandbox.baseUrl;

// Amount minimum per transaksi (dokumen bagian 5)
export const KOMERCE_PAYMENT_MIN_AMOUNT = 10000;

// Expiry default VA (detik) — configurable via admin. Default 15 menit (900 detik).
export const KOMERCE_PAYMENT_DEFAULT_EXPIRY = 900;

// Expiry minimum VA (detik) — dokumen: minimal 3600 (1 jam). QRIS tidak memakai
// nilai ini (fixed 5 menit, lihat KOMERCE_PAYMENT_QRIS_EXPIRY).
export const KOMERCE_PAYMENT_MIN_EXPIRY = 3600;

// QRIS expiry fixed 5 menit (dokumen bagian 5)
export const KOMERCE_PAYMENT_QRIS_EXPIRY = 300;
