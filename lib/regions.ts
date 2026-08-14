// Definisi grup wilayah untuk pembatasan kupon FREE_SHIPPING.
// Province dan city dicocokkan dengan nilai dari model Address (sumber: RajaOngkir).

export interface RegionGroup {
  key: string;
  label: string;
  // Jika province cocok dan cities kosong → semua kota di provinsi itu masuk
  provinces: string[];
  // Jika cities diisi → hanya cocok jika province cocok DAN city mengandung salah satu nilai ini
  cities?: string[];
}

export const REGION_GROUPS: RegionGroup[] = [
  {
    key: "JABODETABEK",
    label: "Jabodetabek",
    // Jakarta full coverage; Bogor/Depok/Bekasi via province Jawa Barat;
    // Tangerang via province Banten — ketiganya dikombinasikan di matchFunction
    provinces: ["DKI Jakarta"],
    // "cities" di sini dipakai secara khusus oleh matchesRegion — lihat komentar di bawah
  },
  {
    key: "BANTEN",
    label: "Banten",
    provinces: ["Banten"],
  },
  {
    key: "JAWA_BARAT",
    label: "Jawa Barat",
    provinces: ["Jawa Barat"],
  },
  {
    key: "JAWA_TENGAH",
    label: "Jawa Tengah",
    provinces: ["Jawa Tengah"],
  },
  {
    key: "YOGYAKARTA",
    label: "DI Yogyakarta",
    provinces: ["DI Yogyakarta", "Daerah Istimewa Yogyakarta", "Yogyakarta"],
  },
  {
    key: "JAWA_TIMUR",
    label: "Jawa Timur",
    provinces: ["Jawa Timur"],
  },
  {
    key: "BALI",
    label: "Bali",
    provinces: ["Bali"],
  },
  {
    key: "NTB",
    label: "Nusa Tenggara Barat",
    provinces: ["Nusa Tenggara Barat", "NTB"],
  },
  {
    key: "NTT",
    label: "Nusa Tenggara Timur",
    provinces: ["Nusa Tenggara Timur", "NTT"],
  },
  {
    key: "SUMATERA_UTARA",
    label: "Sumatera Utara",
    provinces: ["Sumatera Utara"],
  },
  {
    key: "SUMATERA_BARAT",
    label: "Sumatera Barat",
    provinces: ["Sumatera Barat"],
  },
  {
    key: "RIAU",
    label: "Riau",
    provinces: ["Riau"],
  },
  {
    key: "SUMATERA_SELATAN",
    label: "Sumatera Selatan",
    provinces: ["Sumatera Selatan"],
  },
  {
    key: "LAMPUNG",
    label: "Lampung",
    provinces: ["Lampung"],
  },
  {
    key: "KALIMANTAN_BARAT",
    label: "Kalimantan Barat",
    provinces: ["Kalimantan Barat"],
  },
  {
    key: "KALIMANTAN_SELATAN",
    label: "Kalimantan Selatan",
    provinces: ["Kalimantan Selatan"],
  },
  {
    key: "KALIMANTAN_TIMUR",
    label: "Kalimantan Timur",
    provinces: ["Kalimantan Timur"],
  },
  {
    key: "SULAWESI_SELATAN",
    label: "Sulawesi Selatan",
    provinces: ["Sulawesi Selatan"],
  },
];

// Lookup map untuk performa O(1)
const REGION_MAP = new Map<string, RegionGroup>(
  REGION_GROUPS.map((r) => [r.key, r])
);

/**
 * Cek apakah alamat customer cocok dengan setidaknya satu wilayah yang diizinkan.
 * Jabodetabek dicocokkan secara khusus karena melintas 3 provinsi.
 *
 * @param address - { province, city } dari order/checkout
 * @param allowedRegionKeys - array kunci wilayah dari Coupon.allowedRegions (JSON)
 * @returns true jika tidak ada batasan (array kosong) atau alamat cocok
 */
export function addressMatchesAllowedRegions(
  address: { province: string; city: string },
  allowedRegionKeys: string[]
): boolean {
  if (!allowedRegionKeys.length) return true;

  const prov = normalize(address.province);
  const city = normalize(address.city);

  return allowedRegionKeys.some((key) => {
    if (key === "JABODETABEK") {
      return matchesJabodetabek(prov, city);
    }
    const group = REGION_MAP.get(key);
    if (!group) return false;
    return group.provinces.some((p) => prov.includes(normalize(p)));
  });
}

function matchesJabodetabek(prov: string, city: string): boolean {
  // Jakarta: semua wilayah DKI Jakarta
  if (prov.includes("dki jakarta") || prov.includes("jakarta")) return true;
  // Jawa Barat: Bogor, Depok, Bekasi
  if (prov.includes("jawa barat")) {
    if (
      city.includes("bogor") ||
      city.includes("depok") ||
      city.includes("bekasi")
    ) {
      return true;
    }
  }
  // Banten: Tangerang (Kota/Kabupaten/Selatan)
  if (prov.includes("banten") && city.includes("tangerang")) return true;
  return false;
}

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

/**
 * Parse JSON string dari DB ke array kunci wilayah.
 * Mengembalikan [] jika null atau invalid.
 */
export function parseAllowedRegions(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((k) => typeof k === "string");
    return [];
  } catch {
    return [];
  }
}
