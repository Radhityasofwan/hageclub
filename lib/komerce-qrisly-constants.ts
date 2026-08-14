// Client-safe constants untuk QRISLY API (api.collaborator.komerce.id/user)
// Dokumentasi resmi: API-Qrisly.md di root proyek

export const QRISLY_ENVIRONMENTS = {
  sandbox: {
    label: "Sandbox (uji coba)",
    description: "Untuk testing — QRIS disimulasikan, tidak diproses bank.",
    baseUrl: "https://api-sandbox.collaborator.komerce.id/user/",
  },
  production: {
    label: "Production",
    description: "QRIS sungguhan. Wajib menggunakan API key production.",
    baseUrl: "https://api.collaborator.komerce.id/user/",
  },
} as const;

export const DEFAULT_QRISLY_BASE_URL = QRISLY_ENVIRONMENTS.sandbox.baseUrl;

// Amount minimum per generate (dokumen bagian 4: amount must be >= 1000)
export const QRISLY_MIN_AMOUNT = 1000;

// Expiry default 15 menit dari generation (dokumen bagian 4)
export const QRISLY_DEFAULT_EXPIRY_MINUTES = 15;

// Biaya per generate (dokumen bagian 3)
export const QRISLY_COST_PER_GENERATE = 100;

// Upload QRIS statis — file PNG/JPG, maks 5MB (dokumen bagian 4)
export const QRISLY_ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
]);
export const QRISLY_MAX_FILE_SIZE = 5 * 1024 * 1024;
export const QRISLY_NAME_MAX_LENGTH = 100;
