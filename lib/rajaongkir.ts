import { getSettingValues } from "@/lib/settings";
import { COURIER_SET, DEFAULT_BASE_URL } from "@/lib/rajaongkir-constants";
import type {
  V2Province,
  V2City,
  V2District,
  V2SubDistrict,
  V2Destination,
  V2InternationalDestination,
  CourierCost,
  CourierService,
  InternationalCourierService,
  InternationalCostResult,
  ShippingCostResult,
  ShippingErrorItem,
} from "@/types";

export {
  V2_COURIERS,
  COURIER_LABELS,
  DEFAULT_BASE_URL,
} from "@/lib/rajaongkir-constants";

// =============================================================================
// DYNAMIC CONFIG — dibaca dari SystemSetting (DB) dengan fallback ke env.
// Target API: RajaOngkir V2 — https://rajaongkir.komerce.id/api/v1
// (base URL tetap bisa diubah dari admin untuk fleksibilitas).
// =============================================================================

export interface RajaOngkirConfig {
  apiKey: string;
  baseUrl: string;
  originCityId: string;
  originLabel: string;
  couriers: string[];
}

async function getRajaOngkirConfig(): Promise<RajaOngkirConfig> {
  const cfg = await getSettingValues([
    "rajaongkir_api_key",
    "rajaongkir_base_url",
    "rajaongkir_origin_city_id",
    "rajaongkir_origin_label",
    "rajaongkir_couriers",
  ]);
  const couriers = (cfg.rajaongkir_couriers ?? "jne,jnt,sicepat")
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter((c) => COURIER_SET.has(c));
  return {
    apiKey: cfg.rajaongkir_api_key ?? "",
    baseUrl: (cfg.rajaongkir_base_url ?? DEFAULT_BASE_URL).replace(/\/+$/, ""),
    originCityId: cfg.rajaongkir_origin_city_id ?? "",
    originLabel: cfg.rajaongkir_origin_label ?? "",
    couriers,
  };
}

/** Baca konfigurasi untuk server-side (admin page, orders) */
export async function getRajaOngkirSettings(): Promise<RajaOngkirConfig> {
  return getRajaOngkirConfig();
}

export async function isRajaOngkirConfigured(): Promise<boolean> {
  const cfg = await getRajaOngkirConfig();
  return Boolean(cfg.apiKey);
}

// =============================================================================
// ERROR MODEL — kode terstruktur agar UI bisa menampilkan pesan yang tepat
// =============================================================================

export type RajaOngkirErrorCode =
  | "NOT_CONFIGURED"
  | "HTTP_ERROR"
  | "UPSTREAM_ERROR"
  | "INVALID_RESPONSE";

export class RajaOngkirError extends Error {
  code: RajaOngkirErrorCode;
  status?: number;

  constructor(code: RajaOngkirErrorCode, message: string, status?: number) {
    super(message);
    this.name = "RajaOngkirError";
    this.code = code;
    this.status = status;
  }
}

// =============================================================================
// V2 FETCH — envelope { meta: {message, code, status}, data }
// =============================================================================

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function v2Fetch<T>(
  endpoint: string,
  options: RequestInit = {},
  configOverride?: Partial<RajaOngkirConfig>
): Promise<T> {
  const saved = await getRajaOngkirConfig();
  const config = configOverride
    ? { ...saved, ...configOverride }
    : saved;

  if (!config.apiKey) {
    throw new RajaOngkirError(
      "NOT_CONFIGURED",
      "API key RajaOngkir belum dikonfigurasi. Isi di panel admin → Settings → RajaOngkir."
    );
  }

  const response = await fetch(`${config.baseUrl}${endpoint}`, {
    ...options,
    headers: {
      key: config.apiKey,
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    let text = "";
    try {
      text = await response.text();
    } catch {
      /* ignore */
    }
    throw new RajaOngkirError(
      "HTTP_ERROR",
      `RajaOngkir API error ${response.status}${text ? `: ${text}` : ""}`,
      response.status
    );
  }

  let json: Record<string, unknown>;
  try {
    json = await response.json();
  } catch {
    throw new RajaOngkirError(
      "INVALID_RESPONSE",
      "Respon RajaOngkir bukan JSON yang valid."
    );
  }

  // Envelope V2: meta.code !== 200 atau meta.status !== "success" = error
  const meta = json?.meta as { code?: number; status?: string; message?: string } | undefined;
  if (meta && (meta.code !== 200 || meta.status !== "success")) {
    throw new RajaOngkirError(
      "UPSTREAM_ERROR",
      meta.message ?? "RajaOngkir API error",
      meta.code
    );
  }

  return json as T;
}

// =============================================================================
// CACHE LOKASI — hierarki lokasi jarang berubah (24 jam); hasil pencarian
// lebih dinamis (10 menit). Hanya hasil sukses yang di-cache; force=true
// untuk bypass (dipakai saat uji koneksi dari admin).
// =============================================================================

const LOCATION_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const SEARCH_CACHE_TTL_MS = 10 * 60 * 1000;
const locationCache = new Map<
  string,
  { expiresAt: number; data: unknown[] }
>();

function cacheGet<T>(key: string): T[] | null {
  const entry = locationCache.get(key);
  if (!entry || entry.expiresAt < Date.now()) return null;
  return entry.data as T[];
}

function cacheSet(key: string, data: unknown[], ttlMs: number) {
  locationCache.set(key, { expiresAt: Date.now() + ttlMs, data });
}

// =============================================================================
// LOKASI — Metode step-by-step (province → city → district → sub-district)
// =============================================================================

export async function getProvinces(
  opts: { force?: boolean } = {}
): Promise<V2Province[]> {
  const cacheKey = "v2:province:all";
  if (!opts.force) {
    const cached = cacheGet<V2Province>(cacheKey);
    if (cached) return cached;
  }
  const data = await v2Fetch<{ meta: unknown; data: V2Province[] }>(
    "/destination/province"
  );
  cacheSet(cacheKey, data.data, LOCATION_CACHE_TTL_MS);
  return data.data;
}

export async function getCities(
  provinceId: string,
  opts: { force?: boolean } = {}
): Promise<V2City[]> {
  const cacheKey = `v2:city:${provinceId}`;
  if (!opts.force) {
    const cached = cacheGet<V2City>(cacheKey);
    if (cached) return cached;
  }
  const data = await v2Fetch<{ meta: unknown; data: V2City[] }>(
    `/destination/city/${provinceId}`
  );
  cacheSet(cacheKey, data.data, LOCATION_CACHE_TTL_MS);
  return data.data;
}

export async function getDistricts(
  cityId: string,
  opts: { force?: boolean } = {}
): Promise<V2District[]> {
  const cacheKey = `v2:district:${cityId}`;
  if (!opts.force) {
    const cached = cacheGet<V2District>(cacheKey);
    if (cached) return cached;
  }
  const data = await v2Fetch<{ meta: unknown; data: V2District[] }>(
    `/destination/district/${cityId}`
  );
  cacheSet(cacheKey, data.data, LOCATION_CACHE_TTL_MS);
  return data.data;
}

export async function getSubDistricts(
  districtId: string,
  opts: { force?: boolean } = {}
): Promise<V2SubDistrict[]> {
  const cacheKey = `v2:sub:${districtId}`;
  if (!opts.force) {
    const cached = cacheGet<V2SubDistrict>(cacheKey);
    if (cached) return cached;
  }
  const data = await v2Fetch<{ meta: unknown; data: V2SubDistrict[] }>(
    `/destination/sub-district/${districtId}`
  );
  cacheSet(cacheKey, data.data, LOCATION_CACHE_TTL_MS);
  return data.data;
}

// =============================================================================
// LOKASI — Metode pencarian langsung (domestic-destination autocomplete)
// =============================================================================

export async function searchDestinations(
  query: string,
  opts: { force?: boolean } = {}
): Promise<V2Destination[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const cacheKey = `v2:search:${q}`;
  if (!opts.force) {
    const cached = cacheGet<V2Destination>(cacheKey);
    if (cached) return cached;
  }

  const data = await v2Fetch<{ meta: unknown; data: V2Destination[] }>(
    `/destination/domestic-destination?search=${encodeURIComponent(q)}&limit=50&offset=0`
  );
  cacheSet(cacheKey, data.data ?? [], SEARCH_CACHE_TTL_MS);
  return data.data ?? [];
}

// =============================================================================
// SHIPPING COST — /calculate/domestic-cost (V2, per-kurir berurutan agar
// kegagalan satu kurir tidak menenggelamkan kurir lain)
// =============================================================================

export async function getCost(
  origin: string,
  destination: string,
  weight: number,
  couriers: string[]
): Promise<ShippingCostResult> {
  const config = await getRajaOngkirConfig();

  if (!config.apiKey) {
    return {
      costs: [],
      errors: [
        {
          code: "NOT_CONFIGURED",
          message:
            "API key RajaOngkir belum dikonfigurasi. Isi di panel admin → Settings → RajaOngkir.",
        },
      ],
    };
  }

  const validCouriers = couriers.filter((c) => COURIER_SET.has(c));
  if (validCouriers.length === 0) {
    return {
      costs: [],
      errors: [
        {
          code: "NO_COURIERS",
          message:
            "Belum ada kurir aktif. Atur kurir di panel admin → Settings → RajaOngkir.",
        },
      ],
    };
  }

  const costs: CourierCost[] = [];
  const errors: ShippingErrorItem[] = [];

  for (const courier of validCouriers) {
    try {
      const body = new URLSearchParams({
        origin,
        destination,
        weight: String(Math.max(1, Math.round(weight))),
        courier,
        price: "lowest",
      });

      const data = await v2Fetch<{
        meta: unknown;
        data: Array<{
          name: string;
          code: string;
          service: string;
          description: string;
          cost: number;
          etd: string;
        }>;
      }>("/calculate/domestic-cost", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      const services: CourierService[] = (data.data ?? []).map((d) => ({
        service: d.service,
        description: d.description,
        cost: Number(d.cost) || 0,
        etd: d.etd ?? "",
      }));

      const code = data.data?.[0]?.code ?? courier;
      if (services.length > 0) {
        costs.push({ courier: code, services });
      }
    } catch (err) {
      errors.push({
        courier,
        code:
          err instanceof RajaOngkirError ? err.code : ("UPSTREAM_ERROR" as const),
        message: err instanceof Error ? err.message : "Kurir gagal dihitung",
      });
    }
    // Jeda kecil antar-request untuk menghindari rate limit
    await sleep(150);
  }

  return { costs, errors };
}

// =============================================================================
// INTERNASIONAL — search-international-destination & calculate-international-cost
// (dokumentasi resmi: bagian "direct search method" API-shipping-cost.md)
// =============================================================================

export async function searchInternationalDestinations(
  query: string,
  opts: { force?: boolean } = {}
): Promise<V2InternationalDestination[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const cacheKey = `v2:intl-search:${q.toLowerCase()}`;
  if (!opts.force) {
    const cached = cacheGet<V2InternationalDestination>(cacheKey);
    if (cached) return cached;
  }

  const data = await v2Fetch<{ meta: unknown; data: V2InternationalDestination[] }>(
    `/destination/international-destination?search=${encodeURIComponent(q)}&limit=50&offset=0`
  );
  cacheSet(cacheKey, data.data ?? [], SEARCH_CACHE_TTL_MS);
  return data.data ?? [];
}

export async function getInternationalCost(
  origin: string,
  destination: string,
  weight: number,
  couriers: string[]
): Promise<InternationalCostResult> {
  const config = await getRajaOngkirConfig();

  if (!config.apiKey) {
    return {
      costs: [],
      errors: [
        {
          code: "NOT_CONFIGURED",
          message:
            "API key RajaOngkir belum dikonfigurasi. Isi di panel admin → Settings → RajaOngkir.",
        },
      ],
    };
  }

  const validCouriers = couriers.filter((c) => COURIER_SET.has(c));
  if (validCouriers.length === 0) {
    return {
      costs: [],
      errors: [{ code: "NO_COURIERS", message: "Belum ada kurir aktif di pengaturan." }],
    };
  }

  const costs: InternationalCostResult["costs"] = [];
  const errors: ShippingErrorItem[] = [];

  for (const courier of validCouriers) {
    try {
      const body = new URLSearchParams({
        courier,
        origin,
        destination,
        weight: String(Math.max(1, Math.round(weight))),
        price: "lowest",
      });

      const data = await v2Fetch<{
        meta: unknown;
        data: Array<{
          name: string;
          code: string;
          service: string;
          description: string;
          cost: number;
          etd: string;
          currency: string;
          currency_updated_at: string;
          currency_value: number;
        }>;
      }>("/calculate/international-cost", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      const services: InternationalCourierService[] = (data.data ?? []).map((d) => ({
        service: d.service,
        description: d.description,
        cost: Number(d.cost) || 0,
        etd: d.etd ?? "",
        currency: d.currency ?? "",
        currency_updated_at: d.currency_updated_at ?? "",
        currency_value: Number(d.currency_value) || 0,
      }));

      const code = data.data?.[0]?.code ?? courier;
      if (services.length > 0) {
        costs.push({ courier: code, services });
      }
    } catch (err) {
      errors.push({
        courier,
        code:
          err instanceof RajaOngkirError ? err.code : ("UPSTREAM_ERROR" as const),
        message: err instanceof Error ? err.message : "Kurir gagal dihitung",
      });
    }
    await sleep(150);
  }

  return { costs, errors };
}

// =============================================================================
// HELPER SERVER-SIDE (admin page, orders)
// =============================================================================

export async function getActiveCouriers(): Promise<string[]> {
  const cfg = await getRajaOngkirConfig();
  return cfg.couriers;
}

export async function getOriginCityId(): Promise<string> {
  const cfg = await getRajaOngkirConfig();
  return cfg.originCityId;
}

export async function getOriginLabel(): Promise<string> {
  const cfg = await getRajaOngkirConfig();
  return cfg.originLabel;
}

// =============================================================================
// TEST KONEKSI — dipakai panel admin (bisa menguji nilai form yang belum
// disimpan; bypass cache agar hasilnya mencerminkan key terbaru)
// =============================================================================

export interface RajaOngkirCourierTest {
  courier: string;
  ok: boolean;
  service: string | null;
  cost: number | null;
  etd: string | null;
  error: string | null;
}

export interface RajaOngkirTestResult {
  ok: boolean;
  message: string;
  provinces: number;
  costSample: {
    courier: string;
    service: string;
    cost: number;
    etd: string;
  } | null;
  courierResults: RajaOngkirCourierTest[];
}

export async function testRajaOngkirConnection(
  overrides: {
    apiKey?: string;
    baseUrl?: string;
    originCityId?: string;
    couriers?: string[];
  } = {}
): Promise<RajaOngkirTestResult> {
  const saved = await getRajaOngkirConfig();
  const config: Partial<RajaOngkirConfig> = {
    apiKey: overrides.apiKey?.trim() || saved.apiKey,
    baseUrl: overrides.baseUrl?.trim() || saved.baseUrl,
  };

  if (!config.apiKey) {
    return {
      ok: false,
      message: "API Key belum diisi. Isi API Key terlebih dahulu, lalu uji lagi.",
      provinces: 0,
      costSample: null,
      courierResults: [],
    };
  }

  try {
    const provinces = await v2Fetch<{ meta: unknown; data: V2Province[] }>(
      "/destination/province",
      {},
      config
    );
    const count = provinces.data.length;

    // Tes tarif per kurir: rute intra-wilayah (origin → origin), weight 1kg.
    // Wilayah asal & kurir ikut dikirim dari form admin (mungkin belum disimpan).
    const originId = overrides.originCityId?.trim() || saved.originCityId;
    const candidates = overrides.couriers?.length
      ? Array.from(new Set(overrides.couriers.map((c) => c.trim().toLowerCase())))
          .filter((c) => COURIER_SET.has(c))
          .slice(0, 8)
      : ["jne"];

    const courierResults: RajaOngkirCourierTest[] = [];
    let costSample: RajaOngkirTestResult["costSample"] = null;

    if (originId) {
      for (const courier of candidates) {
        try {
          const body = new URLSearchParams({
            origin: originId,
            destination: originId,
            weight: "1000",
            courier,
            price: "lowest",
          });
          const costData = await v2Fetch<{
            meta: unknown;
            data: Array<{
              code: string;
              service: string;
              cost: number;
              etd: string;
            }>;
          }>(
            "/calculate/domestic-cost",
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: body.toString(),
            },
            config
          );
          const item = costData.data?.[0];
          if (item) {
            const cost = Number(item.cost) || 0;
            courierResults.push({
              courier,
              ok: true,
              service: item.service,
              cost,
              etd: item.etd ?? "",
              error: null,
            });
            if (!costSample || cost < costSample.cost) {
              costSample = {
                courier,
                service: item.service,
                cost,
                etd: item.etd ?? "",
              };
            }
          } else {
            courierResults.push({
              courier,
              ok: false,
              service: null,
              cost: null,
              etd: null,
              error: "Tidak ada tarif untuk rute uji.",
            });
          }
        } catch (err) {
          const e = err instanceof RajaOngkirError ? err : null;
          courierResults.push({
            courier,
            ok: false,
            service: null,
            cost: null,
            etd: null,
            error:
              e?.status === 404
                ? "Kurir tidak tersedia untuk API key ini (404)."
                : e?.message ?? (err instanceof Error ? err.message : "Gagal menguji kurir."),
          });
        }
        await sleep(150);
      }
    }

    const okCount = courierResults.filter((r) => r.ok).length;
    const message =
      courierResults.length === 0
        ? `Koneksi berhasil — ${count} provinsi dimuat. Setelah wilayah asal diatur, tarif tiap kurir ikut diuji.`
        : okCount === 0
          ? `Koneksi berhasil — ${count} provinsi dimuat, namun tidak ada kurir yang tersedia untuk API key ini.`
          : `Koneksi berhasil — ${count} provinsi dimuat, ${okCount} dari ${courierResults.length} kurir aktif.`;

    return { ok: true, message, provinces: count, costSample, courierResults };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Koneksi gagal.",
      provinces: 0,
      costSample: null,
      courierResults: [],
    };
  }
}


