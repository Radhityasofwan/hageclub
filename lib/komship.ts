import { getSettingValues } from "@/lib/settings";
import { DEFAULT_KOMSHIP_BASE_URL, KOMSHIP_ENVIRONMENTS } from "@/lib/komship-constants";
import type {
  KomshipCalculateResult,
  KomshipDestination,
  KomshipHistoryEntry,
  KomshipHistoryResult,
  KomshipLabelResult,
  KomshipOrderDetail,
  KomshipOrderRef,
  KomshipPickupResult,
  KomshipService,
  KomshipTestResult,
} from "@/types";

// =============================================================================
// KOMSHIP DELIVERY API — https://api.collaborator.komerce.id/
// (dokumentasi resmi: API-shipping-delivery.md di root proyek)
// =============================================================================

export interface KomshipConfig {
  apiKey: string;
  baseUrl: string;
  brandName: string;
  shipperName: string;
  shipperPhone: string;
  shipperEmail: string;
  shipperDestinationId: string;
  shipperAddress: string;
  originPinPoint: string;
  defaultPickupVehicle: string;
  commodityCode: string;
}

async function getKomshipConfig(): Promise<KomshipConfig> {
  const cfg = await getSettingValues([
    "komerce_environment",
    "komship_api_key",
    "komship_base_url",
    "komship_brand_name",
    "komship_shipper_name",
    "komship_shipper_phone",
    "komship_shipper_email",
    "komship_shipper_destination_id",
    "komship_shipper_address",
    "komship_origin_pin_point",
    "komship_default_pickup_vehicle",
    "komship_commodity_code",
  ]);
  // komerce_environment (shared) wins; falls back to individual base_url
  const sharedEnv = cfg.komerce_environment as string | null;
  const resolvedBaseUrl =
    sharedEnv === "production" ? KOMSHIP_ENVIRONMENTS.production.baseUrl
    : sharedEnv === "sandbox" ? KOMSHIP_ENVIRONMENTS.sandbox.baseUrl
    : (cfg.komship_base_url ?? DEFAULT_KOMSHIP_BASE_URL);
  return {
    apiKey: cfg.komship_api_key ?? "",
    baseUrl: resolvedBaseUrl.replace(/\/+$/, ""),
    brandName: cfg.komship_brand_name ?? "",
    shipperName: cfg.komship_shipper_name ?? "",
    shipperPhone: cfg.komship_shipper_phone ?? "",
    shipperEmail: cfg.komship_shipper_email ?? "",
    shipperDestinationId: cfg.komship_shipper_destination_id ?? "",
    shipperAddress: cfg.komship_shipper_address ?? "",
    originPinPoint: cfg.komship_origin_pin_point ?? "",
    defaultPickupVehicle: cfg.komship_default_pickup_vehicle ?? "Motor",
    commodityCode: cfg.komship_commodity_code ?? "",
  };
}

/** Baca konfigurasi untuk server-side (admin page, routes) */
export async function getKomshipSettings(): Promise<KomshipConfig> {
  return getKomshipConfig();
}

export async function isKomshipConfigured(): Promise<boolean> {
  const cfg = await getKomshipConfig();
  return Boolean(cfg.apiKey && cfg.baseUrl);
}

/** Syarat kelengkapan profil pengirim (tampilan status di panel admin) */
export async function isKomshipProfileComplete(): Promise<boolean> {
  const cfg = await getKomshipConfig();
  return Boolean(
    cfg.apiKey &&
      cfg.brandName &&
      cfg.shipperName &&
      cfg.shipperPhone &&
      cfg.shipperEmail &&
      cfg.shipperAddress &&
      cfg.shipperDestinationId
  );
}

// =============================================================================
// ERROR MODEL — kode sama dengan RajaOngkir agar UI konsisten
// =============================================================================

export type KomshipErrorCode =
  | "NOT_CONFIGURED"
  | "HTTP_ERROR"
  | "UPSTREAM_ERROR"
  | "INVALID_RESPONSE";

export class KomshipError extends Error {
  code: KomshipErrorCode;
  status?: number;

  constructor(code: KomshipErrorCode, message: string, status?: number) {
    super(message);
    this.name = "KomshipError";
    this.code = code;
    this.status = status;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// =============================================================================
// KOMSHIP FETCH — header x-api-key, envelope { meta: {message, code, status} }
// =============================================================================

async function komshipFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  configOverride?: Partial<KomshipConfig>
): Promise<T> {
  const saved = await getKomshipConfig();
  const config = configOverride ? { ...saved, ...configOverride } : saved;

  if (!config.apiKey) {
    throw new KomshipError(
      "NOT_CONFIGURED",
      "API key Komship belum dikonfigurasi. Isi di panel admin → Settings → Pengiriman (Komship)."
    );
  }

  const response = await fetch(`${config.baseUrl}${endpoint}`, {
    ...options,
    headers: {
      "x-api-key": config.apiKey,
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
    throw new KomshipError(
      "HTTP_ERROR",
      `Komship API error ${response.status}${text ? `: ${text}` : ""}`,
      response.status
    );
  }

  let json: Record<string, unknown>;
  try {
    json = await response.json();
  } catch {
    throw new KomshipError(
      "INVALID_RESPONSE",
      "Respon Komship bukan JSON yang valid."
    );
  }

  const meta = json?.meta as { code?: number; status?: string; message?: string } | undefined;
  if (meta && (meta.code !== 200 || meta.status !== "success")) {
    throw new KomshipError(
      "UPSTREAM_ERROR",
      meta.message ?? "Komship API error",
      meta.code
    );
  }

  return json as T;
}

// =============================================================================
// SEARCH DESTINATION — GET /tariff/api/v1/destination/search?keyword=
// =============================================================================

const searchCache = new Map<string, { at: number; data: KomshipDestination[] }>();
const SEARCH_TTL = 10 * 60 * 1000;

export async function searchDestinations(
  keyword: string,
  opts: { force?: boolean } = {}
): Promise<KomshipDestination[]> {
  const q = keyword.trim();
  if (q.length < 2) return [];

  const cacheKey = q.toLowerCase();
  const hit = searchCache.get(cacheKey);
  if (!opts.force && hit && Date.now() - hit.at < SEARCH_TTL) {
    return hit.data;
  }

  const data = await komshipFetch<{ meta: unknown; data: KomshipDestination[] }>(
    `/tariff/api/v1/destination/search?keyword=${encodeURIComponent(q)}`
  );
  const list = data.data ?? [];
  searchCache.set(cacheKey, { at: Date.now(), data: list });
  return list;
}

// =============================================================================
// CALCULATE — GET /tariff/api/v1/calculate?shipper_destination_id=&receiver_destination_id=&weight=&item_value=&cod=
// (weight dalam kilogram, desimal pakai titik)
// =============================================================================

export interface KomshipCalculateParams {
  shipperDestinationId: string | number;
  receiverDestinationId: string | number;
  weightKg: number;
  itemValue: number;
  cod?: boolean;
  originPinPoint?: string;
  destinationPinPoint?: string;
}

interface RawKomshipService {
  shipping_name: string;
  service_name: string;
  weight: number;
  is_cod: boolean;
  shipping_cost: number;
  shipping_cashback: number;
  shipping_cost_net: number;
  grandtotal: number;
  service_fee: number;
  net_income: number;
  etd: string;
}

function mapService(raw: RawKomshipService): KomshipService {
  return {
    shippingName: raw.shipping_name,
    serviceName: raw.service_name,
    weight: raw.weight,
    isCod: raw.is_cod,
    shippingCost: Number(raw.shipping_cost) || 0,
    shippingCashback: Number(raw.shipping_cashback) || 0,
    shippingCostNet: Number(raw.shipping_cost_net) || 0,
    grandtotal: Number(raw.grandtotal) || 0,
    serviceFee: Number(raw.service_fee) || 0,
    netIncome: Number(raw.net_income) || 0,
    etd: raw.etd ?? "",
  };
}

export async function calculateShipping(
  params: KomshipCalculateParams
): Promise<KomshipCalculateResult> {
  const query = new URLSearchParams({
    shipper_destination_id: String(params.shipperDestinationId),
    receiver_destination_id: String(params.receiverDestinationId),
    weight: String(Math.max(0.001, params.weightKg)),
    item_value: String(Math.max(0, Math.round(params.itemValue))),
    cod: params.cod ? "yes" : "no",
  });
  if (params.originPinPoint) query.set("origin_pin_point", params.originPinPoint);
  if (params.destinationPinPoint) query.set("destination_pin_point", params.destinationPinPoint);

  const data = await komshipFetch<{
    meta: unknown;
    data: {
      calculate_reguler?: RawKomshipService[];
      calculate_cargo?: RawKomshipService[];
      calculate_instant?: RawKomshipService[];
    };
  }>(`/tariff/api/v1/calculate?${query.toString()}`);

  return {
    reguler: (data.data?.calculate_reguler ?? []).map(mapService),
    cargo: (data.data?.calculate_cargo ?? []).map(mapService),
    instant: (data.data?.calculate_instant ?? []).map(mapService),
  };
}

// =============================================================================
// STORE ORDER — POST /order/api/v1/orders/store
// =============================================================================

export interface KomshipStoreOrderItem {
  productName: string;
  productVariantName: string;
  productPrice: number;
  productWeight: number;
  productWidth: number;
  productHeight: number;
  productLength: number;
  qty: number;
  subtotal: number;
}

export interface KomshipStoreOrderParams {
  orderDate: string; // YYYY-MM-DD
  brandName: string;
  shipperName: string;
  shipperPhone: string;
  shipperDestinationId: number;
  shipperAddress: string;
  shipperEmail: string;
  receiverName: string;
  receiverPhone: string;
  receiverDestinationId: number;
  receiverAddress: string;
  shipping: string;
  shippingType: string;
  paymentMethod: "COD" | "BANK TRANSFER";
  shippingCost: number;
  shippingCashback: number;
  serviceFee: number;
  additionalCost: number;
  grandTotal: number;
  codValue: number;
  insuranceValue: number;
  originPinPoint?: string;
  destinationPinPoint?: string;
  commodityCode?: string;
  notes?: string;
  orderDetails: KomshipStoreOrderItem[];
}

export async function storeOrder(
  params: KomshipStoreOrderParams
): Promise<KomshipOrderRef> {
  const body: Record<string, unknown> = {
    order_date: params.orderDate,
    brand_name: params.brandName,
    shipper_name: params.shipperName,
    shipper_phone: params.shipperPhone,
    shipper_destination_id: params.shipperDestinationId,
    shipper_address: params.shipperAddress,
    shipper_email: params.shipperEmail,
    receiver_name: params.receiverName,
    receiver_phone: params.receiverPhone,
    receiver_destination_id: params.receiverDestinationId,
    receiver_address: params.receiverAddress,
    shipping: params.shipping,
    shipping_type: params.shippingType,
    payment_method: params.paymentMethod,
    shipping_cost: params.shippingCost,
    shipping_cashback: params.shippingCashback,
    service_fee: params.serviceFee,
    additional_cost: params.additionalCost,
    grand_total: params.grandTotal,
    cod_value: params.codValue,
    insurance_value: params.insuranceValue,
    notes: params.notes ?? "",
    order_details: params.orderDetails.map((d) => ({
      product_name: d.productName,
      product_variant_name: d.productVariantName,
      product_price: d.productPrice,
      product_weight: d.productWeight,
      product_width: d.productWidth,
      product_height: d.productHeight,
      product_length: d.productLength,
      qty: d.qty,
      subtotal: d.subtotal,
    })),
  };
  if (params.originPinPoint) body.origin_pin_point = params.originPinPoint;
  if (params.destinationPinPoint) body.destination_pin_point = params.destinationPinPoint;
  if (params.commodityCode) body.commodity_code = params.commodityCode;

  const data = await komshipFetch<{
    meta: unknown;
    data: { order_id: number; order_no: string };
  }>("/order/api/v1/orders/store", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });

  return {
    orderId: data.data?.order_id ?? 0,
    orderNo: data.data?.order_no ?? "",
  };
}

// =============================================================================
// REGISTER WEBHOOK — PUT /webhook (dokumen section 15: "Webhook")
// Daftarkan/update URL penerima notifikasi status (Diajukan, Dijemput,
// Dikirim, Dibatalkan, Selesai). Wajib HTTPS; Komerce mengirim payload
// { order_no, cnote, status } ke URL ini.
// =============================================================================

export interface KomshipWebhookResult {
  ok: boolean;
  message: string;
}

export async function registerWebhook(
  webhookUrl: string
): Promise<KomshipWebhookResult> {
  const url = webhookUrl.trim();
  if (!url) {
    return { ok: false, message: "Webhook URL kosong." };
  }
  if (!/^https:\/\//i.test(url)) {
    return {
      ok: false,
      message:
        "Komerce hanya menerima URL HTTPS (dokumen section 15). Periksa NEXT_PUBLIC_APP_URL di .env.local.",
    };
  }

  try {
    await komshipFetch<{ meta: unknown; data: unknown }>("/webhook", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ webhook_url: url }),
    });
    return { ok: true, message: "Webhook berhasil didaftarkan di Komerce." };
  } catch (err) {
    const e = err instanceof KomshipError ? err : null;
    return {
      ok: false,
      message:
        e?.message ??
        (err instanceof Error ? err.message : "Gagal mendaftarkan webhook."),
    };
  }
}

// =============================================================================
// CANCEL ORDER — PUT /order/api/v1/orders/cancel
// =============================================================================

export async function cancelOrder(orderNo: string): Promise<void> {
  await komshipFetch<{ meta: unknown; data: unknown }>("/order/api/v1/orders/cancel", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ order_no: orderNo }),
  });
}

// =============================================================================
// DETAIL ORDER — GET /order/api/v1/orders/detail?order_no=
// =============================================================================

export async function orderDetail(orderNo: string): Promise<KomshipOrderDetail> {
  const data = await komshipFetch<{
    meta: unknown;
    data: Record<string, unknown>;
  }>(`/order/api/v1/orders/detail?order_no=${encodeURIComponent(orderNo)}`);

  const raw = data.data ?? {};
  const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);

  return {
    orderNo: String(raw.order_no ?? orderNo),
    awb: raw.awb ? String(raw.awb) : null,
    orderStatus: String(raw.order_status ?? ""),
    orderDate: String(raw.order_date ?? ""),
    brandName: String(raw.brand_name ?? ""),
    shipperName: String(raw.shipper_name ?? ""),
    receiverName: String(raw.receiver_name ?? ""),
    receiverPhone: String(raw.receiver_phone ?? ""),
    receiverAddress: String(raw.receiver_address ?? ""),
    shipping: String(raw.shipping ?? ""),
    shippingType: String(raw.shipping_type ?? ""),
    paymentMethod: String(raw.payment_method ?? ""),
    shippingCost: num(raw.shipping_cost),
    shippingCashback: num(raw.shipping_cashback),
    serviceFee: num(raw.service_fee),
    additionalCost: num(raw.additional_cost),
    grandTotal: num(raw.grand_total),
    codValue: num(raw.cod_value),
    insuranceValue: num(raw.insurance_value),
    driverName: raw.driver_name ? String(raw.driver_name) : null,
    driverPhone: raw.driver_phone ? String(raw.driver_phone) : null,
    liveTrackingUrl: raw.live_tracking_url ? String(raw.live_tracking_url) : null,
    cancelationReason: raw.cancelation_reason ? String(raw.cancelation_reason) : null,
    notes: raw.notes ? String(raw.notes) : null,
    raw,
  };
}

// =============================================================================
// HISTORY AWB — GET /order/api/v1/orders/history-airway-bill?shipping=&airway_bill=
// =============================================================================

export async function historyAWB(
  courier: string,
  airwayBill: string
): Promise<KomshipHistoryResult> {
  const data = await komshipFetch<{
    meta: unknown;
    data: {
      airway_bill: string;
      last_status: string;
      history?: Array<{ desc: string; date: string; code: string; status: string }>;
    };
  }>(
    `/order/api/v1/orders/history-airway-bill?shipping=${encodeURIComponent(courier)}&airway_bill=${encodeURIComponent(airwayBill)}`
  );

  const history: KomshipHistoryEntry[] = (data.data?.history ?? []).map((h) => ({
    desc: h.desc ?? "",
    date: h.date ?? "",
    code: h.code ?? "",
    status: h.status ?? "",
  }));

  return {
    airwayBill: data.data?.airway_bill ?? airwayBill,
    lastStatus: data.data?.last_status ?? "",
    history,
  };
}

// =============================================================================
// PICKUP ORDER — POST /order/api/v1/pickup/request
// =============================================================================

export interface KomshipPickupParams {
  pickupDate: string; // YYYY-MM-DD
  pickupTime: string; // HH:mm:ss
  pickupVehicle: "Motor" | "Mobil" | "Truk";
  orderNos: string[];
}

export async function requestPickup(
  params: KomshipPickupParams
): Promise<KomshipPickupResult[]> {
  const data = await komshipFetch<{
    meta: unknown;
    data: Array<{ status: string; order_no: string; awb: string }>;
  }>("/order/api/v1/pickup/request", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      pickup_date: params.pickupDate,
      pickup_time: params.pickupTime,
      pickup_vehicle: params.pickupVehicle,
      orders: params.orderNos.map((orderNo) => ({ order_no: orderNo })),
    }),
  });

  return (data.data ?? []).map((r) => ({
    status: r.status,
    orderNo: r.order_no,
    awb: r.awb,
  }));
}

// =============================================================================
// PRINT LABEL — POST /order/api/v1/orders/print-label?page=&order_no=
// =============================================================================

export async function printLabel(
  orderNo: string,
  page: string
): Promise<KomshipLabelResult> {
  const data = await komshipFetch<{
    meta: unknown;
    data: { path: string; base_64: string };
  }>(`/order/api/v1/orders/print-label?page=${encodeURIComponent(page)}&order_no=${encodeURIComponent(orderNo)}`, {
    method: "POST",
  });

  return {
    path: data.data?.path ?? "",
    base64: data.data?.base_64 ?? "",
  };
}

// =============================================================================
// UTILITAS
// =============================================================================

/** Normalisasi nomor HP Komship: wajib diawali 0 atau 62, bukan +62 */
export function normalizePhone(phone: string): string {
  const cleaned = phone.trim().replace(/[^0-9]/g, "");
  if (cleaned.startsWith("62")) return cleaned;
  if (cleaned.startsWith("0")) return cleaned;
  return cleaned;
}

/**
 * Hitung insurance_value per rumus resmi Komship (dokumen bagian 7).
 * Berlaku jika total harga produk >= Rp300.000.
 */
export function calculateInsuranceValue(
  courier: string,
  totalProductPrice: number,
  grandTotal: number
): number {
  const MIN = 300000;
  const tpp = totalProductPrice;
  if (tpp < MIN) return 0;

  const name = courier.toUpperCase();
  let value = 0;
  if (name === "JNE") value = 0.002 * tpp + 5000;
  else if (name === "SICEPAT") value = grandTotal > 500000 ? 0.003 * grandTotal : 0;
  else if (name === "IDEXPRESS") value = 0.002 * tpp;
  else if (name === "SAP") value = 0.003 * tpp + 2000;
  else if (name === "NINJA") value = tpp <= 1000000 ? 2500 : 0.0025 * tpp;
  else if (name === "JNT") value = 0.002 * tpp;
  else if (name === "LION") value = 0.003 * tpp;
  // GOSEND: asuransi per pilihan (Silver/Gold/Platinum) — tidak ada default otomatis

  return Math.round(value);
}

// =============================================================================
// TEST KONEKSI — dipakai panel admin (bisa menguji nilai form yang belum disimpan)
// =============================================================================

export async function testKomshipConnection(
  overrides: { apiKey?: string; baseUrl?: string; shipperDestinationId?: string } = {}
): Promise<KomshipTestResult> {
  const saved = await getKomshipConfig();
  const config: Partial<KomshipConfig> = {
    apiKey: overrides.apiKey?.trim() || saved.apiKey,
    baseUrl: overrides.baseUrl?.trim() || saved.baseUrl,
  };

  if (!config.apiKey) {
    return {
      ok: false,
      message: "API Key belum diisi. Isi API Key terlebih dahulu, lalu uji lagi.",
      searchCount: 0,
      calculate: null,
    };
  }

  try {
    const destinations = await komshipFetch<{ meta: unknown; data: KomshipDestination[] }>(
      "/tariff/api/v1/destination/search?keyword=jakarta",
      {},
      config
    );
    const searchCount = destinations.data?.length ?? 0;

    // Tes tarif opsional: rute asal → asal (valid untuk semua kurir)
    let calculate: KomshipCalculateResult | null = null;
    const originId = overrides.shipperDestinationId?.trim() || saved.shipperDestinationId;
    if (originId) {
      try {
        const body = new URLSearchParams({
          shipper_destination_id: originId,
          receiver_destination_id: originId,
          weight: "1",
          item_value: "100000",
          cod: "no",
        });
        const data = await komshipFetch<{
          meta: unknown;
          data: {
            calculate_reguler?: RawKomshipService[];
            calculate_cargo?: RawKomshipService[];
            calculate_instant?: RawKomshipService[];
          };
        }>(`/tariff/api/v1/calculate?${body.toString()}`, {}, config);
        calculate = {
          reguler: (data.data?.calculate_reguler ?? []).map(mapService),
          cargo: (data.data?.calculate_cargo ?? []).map(mapService),
          instant: (data.data?.calculate_instant ?? []).map(mapService),
        };
      } catch {
        // Tes tarif opsional — koneksi tetap dianggap berhasil
      }
    }

    return {
      ok: true,
      message: originId
        ? `Koneksi berhasil — ${searchCount} hasil pencarian lokasi, tarif ${calculate ? "berhasil dimuat" : "dilewati"}.`
        : `Koneksi berhasil — ${searchCount} hasil pencarian lokasi. Setelah wilayah asal diatur, tarif ikut diuji.`,
      searchCount,
      calculate,
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Koneksi gagal.",
      searchCount: 0,
      calculate: null,
    };
  }
}

export { sleep };
