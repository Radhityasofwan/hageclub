// Katalog kurir API RajaOngkir V2 (rajaongkir.komerce.id/api/v1) —
// sesuai dokumentasi resmi contoh batch kurir:
// jne, sicepat, ide, sap, jnt, ninja, tiki, lion, anteraja, pos, ncs,
// rex, rpx, sentral, star, wahana, dse
//
// Modul ini bebas efek samping (tanpa DB/Prisma) agar aman diimpor
// dari client components (form admin) maupun server.

export const V2_COURIERS = [
  "jne", "pos", "tiki", "sicepat", "jnt", "ninja", "lion", "anteraja",
  "rex", "rpx", "sentral", "star", "wahana", "dse", "ide", "sap", "ncs",
];

export const COURIER_LABELS: Record<string, string> = {
  jne: "JNE",
  pos: "POS Indonesia",
  tiki: "TIKI",
  sicepat: "SiCepat",
  jnt: "J&T Express",
  ninja: "Ninja Xpress",
  lion: "Lion Parcel",
  anteraja: "AnterAja",
  rex: "REX",
  rpx: "RPX",
  sentral: "Sentral Cargo",
  star: "STAR Cargo",
  wahana: "Wahana",
  dse: "DSE",
  ide: "IDE",
  sap: "SAP",
  ncs: "NCS",
};

export const COURIER_SET = new Set(V2_COURIERS);

/**
 * Resolve kode kurir dari input yang bisa berupa kode ("jnt") ATAU label
 * tampilan ("J&T Express", "SiCepat"). Dipakai di orders route (verifikasi
 * ongkir) dan delivery/tracking (mapping Komship) karena order.courier
 * tersimpan sebagai label. Kembalikan null jika tidak dikenal.
 */
export function courierCodeFromLabel(labelOrCode: string): string | null {
  const q = labelOrCode.trim().toLowerCase();
  if (COURIER_SET.has(q)) return q;
  for (const [code, label] of Object.entries(COURIER_LABELS)) {
    if (label.toLowerCase() === q) return code;
  }
  return null;
}

/**
 * Label tampilan kurir untuk UI. order.courier tersimpan sebagai label
 * ("J&T Express"), tapi order lama bisa berisi kode ("jne") — helper ini
 * mengembalikan label yang benar untuk keduanya.
 */
export function courierDisplayLabel(labelOrCode: string): string {
  const code = courierCodeFromLabel(labelOrCode);
  return code ? COURIER_LABELS[code] : labelOrCode;
}

export const DEFAULT_BASE_URL = "https://rajaongkir.komerce.id/api/v1";
