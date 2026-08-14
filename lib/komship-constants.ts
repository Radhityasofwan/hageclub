// Client-safe constants untuk Komship Delivery API (api.collaborator.komerce.id)
import { courierCodeFromLabel } from "@/lib/rajaongkir-constants";

export const KOMSHIP_ENVIRONMENTS = {
  sandbox: {
    label: "Sandbox (uji coba)",
    description: "Untuk testing — tidak ada pengiriman nyata. Hanya JNE & Ninja tersedia untuk pickup.",
    baseUrl: "https://api-sandbox.collaborator.komerce.id/",
  },
  production: {
    label: "Production",
    description: "Pengiriman nyata. Wajib menggunakan API key production.",
    baseUrl: "https://api.collaborator.komerce.id/",
  },
} as const;

export const DEFAULT_KOMSHIP_BASE_URL = KOMSHIP_ENVIRONMENTS.sandbox.baseUrl;

// Format label: page_1 (A4, 1/halaman), page_2 (A4, 2/halaman), page_4 (A4, 4/halaman/A6),
// page_5 (Thermal 10x10), page_6 (Thermal 10x15)
export const KOMSHIP_LABEL_PAGES = [
  { value: "page_1", label: "A4 — 1 label per halaman" },
  { value: "page_2", label: "A4 — 2 label per halaman" },
  { value: "page_4", label: "A4 — 4 label per halaman (A6)" },
  { value: "page_5", label: "Thermal 10×10 cm" },
  { value: "page_6", label: "Thermal 10×15 cm" },
] as const;

export const KOMSHIP_PICKUP_VEHICLES = ["Motor", "Mobil", "Truk"] as const;

// Kode kurir V2 (rajaongkir cost) → nama kurir Komship (shipping_name)
export const KOMSHIP_COURIER_ALIASES: Record<string, string> = {
  jne: "JNE",
  jnt: "JNT",
  sicepat: "SICEPAT",
  ide: "IDEXPRESS",
  sap: "SAP",
  ninja: "NINJA",
  lion: "LION",
  gosend: "GOSEND",
};

/**
 * Nama kurir Komship dari kode ATAU label (order.courier tersimpan sebagai
 * label, mis. "J&T Express"). Kembalikan null jika kurir tidak dikenal
 * Komship — pemanggil boleh fallback ke label mentah.
 */
export function komshipCourierName(labelOrCode: string): string | null {
  const code = courierCodeFromLabel(labelOrCode);
  if (!code) return null;
  return KOMSHIP_COURIER_ALIASES[code] ?? null;
}
