import crypto from "crypto";
import { getSettingValues } from "@/lib/settings";
import {
  DEFAULT_KOMERCE_PAYMENT_BASE_URL,
  KOMERCE_PAYMENT_DEFAULT_EXPIRY,
  KOMERCE_PAYMENT_MIN_EXPIRY,
  KOMERCE_PAYMENT_QRIS_EXPIRY,
  KOMERCE_PAYMENT_ENVIRONMENTS,
} from "@/lib/komerce-payment-constants";
import type {
  KomercePaymentCreateResult,
  KomercePaymentMethod,
  KomercePaymentStatusResult,
  KomercePaymentTestResult,
} from "@/types";

// =============================================================================
// KOMERCE PAYMENT API — VA & QRIS
// (dokumentasi resmi: API-payment-service.md di root proyek)
// Base URL: https://api.collaborator.komerce.id/user (production)
//           https://api-sandbox.collaborator.komerce.id/user (sandbox)
// Auth: header x-api-key
// =============================================================================

export interface KomercePaymentConfig {
  apiKey: string;
  baseUrl: string;
  callbackApiKey: string;
  /** Expiry VA dalam detik (default 24 jam) */
  expiryDuration: number;
}

async function getKomercePaymentConfig(): Promise<KomercePaymentConfig> {
  const cfg = await getSettingValues([
    "komerce_environment",
    "komerce_payment_api_key",
    "komerce_payment_base_url",
    "komerce_payment_callback_api_key",
    "komerce_payment_expiry_duration",
  ]);
  // komerce_environment (shared) wins; falls back to individual base_url
  const sharedEnv = cfg.komerce_environment as string | null;
  const resolvedBaseUrl =
    sharedEnv === "production" ? KOMERCE_PAYMENT_ENVIRONMENTS.production.baseUrl
    : sharedEnv === "sandbox" ? KOMERCE_PAYMENT_ENVIRONMENTS.sandbox.baseUrl
    : (cfg.komerce_payment_base_url ?? DEFAULT_KOMERCE_PAYMENT_BASE_URL);
  return {
    apiKey: cfg.komerce_payment_api_key ?? "",
    baseUrl: resolvedBaseUrl.replace(/\/+$/, ""),
    callbackApiKey: cfg.komerce_payment_callback_api_key ?? "",
    expiryDuration: Math.max(
      KOMERCE_PAYMENT_MIN_EXPIRY,
      Number(cfg.komerce_payment_expiry_duration ?? String(KOMERCE_PAYMENT_DEFAULT_EXPIRY)) || KOMERCE_PAYMENT_DEFAULT_EXPIRY
    ),
  };
}

/** Baca konfigurasi untuk server-side (admin page, routes) */
export async function getKomercePaymentSettings(): Promise<KomercePaymentConfig> {
  return getKomercePaymentConfig();
}

export async function isKomercePaymentConfigured(): Promise<boolean> {
  const cfg = await getKomercePaymentConfig();
  return Boolean(cfg.apiKey && cfg.baseUrl);
}

// =============================================================================
// ERROR MODEL — kode sama dengan RajaOngkir/Komship agar UI konsisten
// =============================================================================

export type KomercePaymentErrorCode =
  | "NOT_CONFIGURED"
  | "HTTP_ERROR"
  | "UPSTREAM_ERROR"
  | "INVALID_RESPONSE";

export class KomercePaymentError extends Error {
  code: KomercePaymentErrorCode;
  status?: number;

  constructor(code: KomercePaymentErrorCode, message: string, status?: number) {
    super(message);
    this.name = "KomercePaymentError";
    this.code = code;
    this.status = status;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// =============================================================================
// PAYMENT FETCH — header x-api-key, envelope { meta: {message, code, status} }
// =============================================================================

async function paymentFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  configOverride?: Partial<KomercePaymentConfig>
): Promise<T> {
  const saved = await getKomercePaymentConfig();
  const config = configOverride ? { ...saved, ...configOverride } : saved;

  if (!config.apiKey) {
    throw new KomercePaymentError(
      "NOT_CONFIGURED",
      "API key Payment belum dikonfigurasi. Isi di panel admin → Settings → Pembayaran."
    );
  }

  const response = await fetch(`${config.baseUrl}${endpoint}`, {
    ...options,
    headers: {
      "x-api-key": config.apiKey,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    // Extract meta.message from Komerce JSON error envelope when available.
    let errorMessage = `Payment API error ${response.status}`;
    try {
      const errJson = (await response.json()) as {
        meta?: { message?: string };
      };
      if (errJson.meta?.message) errorMessage = errJson.meta.message;
    } catch {
      try {
        const text = await response.text();
        if (text) errorMessage = `Payment API error ${response.status}: ${text}`;
      } catch { /* ignore */ }
    }
    throw new KomercePaymentError("HTTP_ERROR", errorMessage, response.status);
  }

  const json = (await response.json()) as {
    meta?: { message?: string; code?: number; status?: string };
    data?: T;
  };

  if (
    json.meta &&
    (json.meta.code !== 200 || (json.meta.status && json.meta.status !== "success"))
  ) {
    throw new KomercePaymentError(
      "UPSTREAM_ERROR",
      json.meta.message ?? "Payment API error"
    );
  }

  if (json.data === undefined) {
    throw new KomercePaymentError("INVALID_RESPONSE", "Respons Payment API tidak valid.");
  }

  return json.data;
}

/** Base URL halaman pembayaran (pay.komerce.id) dari environment terpilih */
function getPayBaseUrl(baseUrl: string): string {
  const clean = baseUrl.replace(/\/+$/, "");
  for (const env of Object.values(KOMERCE_PAYMENT_ENVIRONMENTS)) {
    if (clean === env.baseUrl.replace(/\/+$/, "")) {
      return env.payBaseUrl.replace(/\/+$/, "");
    }
  }
  // Fallback: sandbox (tanpa env yang dikenal, paling aman untuk uji coba)
  return KOMERCE_PAYMENT_ENVIRONMENTS.sandbox.payBaseUrl.replace(/\/+$/, "");
}

// =============================================================================
// GET /api/v1/user/methods — daftar metode pembayaran (VA banks + QRIS)
// Cache 1 jam (dokumen: cached responses, 1 hour TTL)
// Respons asli bersnake_case (payment_type, display_name, bank_code, logo_url,
// min_amount, max_amount, currency) → dipetakan ke interface camelCase.
// =============================================================================

type RawPaymentMethod = {
  payment_type?: unknown;
  display_name?: unknown;
  bank_code?: unknown;
  logo_url?: unknown;
  min_amount?: unknown;
  max_amount?: unknown;
  currency?: unknown;
};

function toAmount(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Metode pembayaran yang didokumentasikan hanya va & qris; ewallet dikenali
 *  untuk ditampilkan (disabled — belum tersedia di server). Metode baru yang
 *  belum dikenal ditampilkan sebagai VA agar tidak menghilang dari list. */
function normalizePaymentType(value: unknown): "va" | "qris" | "ewallet" {
  const t = String(value ?? "").toLowerCase();
  if (t === "va" || t === "qris" || t === "ewallet") return t;
  return "va";
}

let methodsCache: { at: number; data: KomercePaymentMethod[] } | null = null;
const METHODS_TTL_MS = 60 * 60 * 1000;

export async function getPaymentMethods(
  configOverride?: Partial<KomercePaymentConfig>
): Promise<KomercePaymentMethod[]> {
  if (!configOverride && methodsCache && Date.now() - methodsCache.at < METHODS_TTL_MS) {
    return methodsCache.data;
  }

  const data = await paymentFetch<RawPaymentMethod[]>(
    "/api/v1/user/methods",
    {},
    configOverride
  );

  const methods = (Array.isArray(data) ? data : []).map(
    (m): KomercePaymentMethod => ({
      paymentType: normalizePaymentType(m.payment_type),
      displayName: String(m.display_name ?? ""),
      bankCode: String(m.bank_code ?? ""),
      logoUrl: String(m.logo_url ?? ""),
      minAmount: toAmount(m.min_amount),
      maxAmount: toAmount(m.max_amount),
      currency: String(m.currency ?? "IDR"),
    })
  );

  if (!configOverride) {
    methodsCache = { at: Date.now(), data: methods };
  }
  return methods;
}

// =============================================================================
// POST /api/v1/user/payment/create — buat transaksi VA / QRIS
// =============================================================================

export interface CreatePaymentTransactionParams {
  /** order_id eksternal — pakai orderNumber (max 100 karakter) */
  orderId: string;
  paymentType: "bank_transfer" | "qris";
  /** channel_code bank — wajib untuk bank_transfer, diabaikan untuk qris */
  channelCode?: string;
  /** minimal Rp 10.000 */
  amount: number;
  customer: { name: string; email: string; phone: string };
  items: Array<{ name: string; quantity: number; price: number }>;
  /** detik — minimal 3600, hanya untuk VA (QRIS fixed 5 menit) */
  expiryDuration?: number;
  callbackUrl?: string;
  callbackApiKey?: string;
}

export async function createPaymentTransaction(
  params: CreatePaymentTransactionParams
): Promise<KomercePaymentCreateResult> {
  const config = await getKomercePaymentConfig();

  const payload: Record<string, unknown> = {
    order_id: params.orderId.slice(0, 100),
    payment_type: params.paymentType,
    amount: params.amount,
    customer: params.customer,
    items: params.items,
  };

  if (params.paymentType === "bank_transfer") {
    if (!params.channelCode) {
      throw new KomercePaymentError(
        "INVALID_RESPONSE",
        "channel_code wajib untuk pembayaran Virtual Account."
      );
    }
    payload.channel_code = params.channelCode;
    // Komerce enforces minimum 3600 s for VA (dokumen bagian 5) — always send at least
    // KOMERCE_PAYMENT_MIN_EXPIRY regardless of admin setting.
    payload.expiry_duration = Math.max(
      KOMERCE_PAYMENT_MIN_EXPIRY,
      params.expiryDuration ?? config.expiryDuration
    );
  }

  // callback_url hanya dikirim bila callback_api_key tersedia (wajib berpasangan)
  const callbackApiKey = params.callbackApiKey ?? config.callbackApiKey;
  if (params.callbackUrl && callbackApiKey) {
    payload.callback_url = params.callbackUrl;
    payload.callback_api_key = callbackApiKey;
  }

  const data = await paymentFetch<Record<string, unknown>>(
    "/api/v1/user/payment/create",
    { method: "POST", body: JSON.stringify(payload) }
  );

  const paymentId = (data.payment_id ?? data.id ?? "") as string;
  if (!paymentId) {
    throw new KomercePaymentError(
      "INVALID_RESPONSE",
      "Komerce tidak mengembalikan payment_id."
    );
  }

  const payBase = getPayBaseUrl(config.baseUrl);
  const payPage = `${payBase}/${paymentId}`;

  // Display duration sesuai dokumen: VA minimal 1 jam (server enforce 3600, countdown
  // tidak boleh lebih pendek dari itu); QRIS fixed 5 menit (KOMERCE_PAYMENT_QRIS_EXPIRY).
  const displayDuration =
    params.paymentType === "qris"
      ? KOMERCE_PAYMENT_QRIS_EXPIRY
      : Math.max(KOMERCE_PAYMENT_MIN_EXPIRY, params.expiryDuration ?? config.expiryDuration);
  const expiresAt = new Date(Date.now() + displayDuration * 1000).toISOString();

  return {
    paymentId,
    status: (data.status ?? null) as string | null,
    vaNumber: (data.va_number ?? data.vaNumber ?? null) as string | null,
    qrString: (data.qr_string ?? data.qrString ?? null) as string | null,
    paymentUrl:
      (data.payment_url ?? data.paymentUrl ?? payPage) as string | null,
    expiresAt,
    raw: data,
  };
}

// =============================================================================
// GET /api/v1/user/payment/status/{payment_id}
// Rate limit: 1 request per 3 detik per payment_id → throttle di sisi kita
// =============================================================================

const statusThrottle = new Map<
  string,
  { at: number; data: KomercePaymentStatusResult }
>();
const STATUS_THROTTLE_MS = 3000;

export async function getPaymentTransactionStatus(
  paymentId: string
): Promise<KomercePaymentStatusResult> {
  const cached = statusThrottle.get(paymentId);
  if (cached && Date.now() - cached.at < STATUS_THROTTLE_MS) {
    return cached.data;
  }

  const data = await paymentFetch<Record<string, unknown>>(
    `/api/v1/user/payment/status/${encodeURIComponent(paymentId)}`
  );

  const rawStatus = ((data.status ?? data.payment_status ?? "PENDING") as string).toUpperCase();
  const status: KomercePaymentStatusResult["status"] = ["PENDING", "PAID", "EXPIRED", "CANCELED"].includes(
    rawStatus
  )
    ? (rawStatus as KomercePaymentStatusResult["status"])
    : "PENDING";

  const result: KomercePaymentStatusResult = {
    paymentId: (data.payment_id ?? data.id ?? paymentId) as string,
    status,
    paidAt: (data.paid_at ?? data.payment_time ?? null) as string | null,
    paidAmount: typeof data.paid_amount === "number" ? data.paid_amount : null,
    method: (data.payment_method ?? data.payment_type ?? null) as string | null,
    raw: data,
  };

  statusThrottle.set(paymentId, { at: Date.now(), data: result });
  return result;
}

// =============================================================================
// POST /api/v1/user/payment/cancel — batalkan transaksi PENDING
// =============================================================================

export async function cancelPaymentTransaction(
  paymentId: string,
  reason?: string
): Promise<void> {
  await paymentFetch("/api/v1/user/payment/cancel", {
    method: "POST",
    body: JSON.stringify({ payment_id: paymentId, reason: reason ?? "Canceled by merchant" }),
  });
}

// =============================================================================
// CALLBACK VERIFICATION — HMAC-SHA256
// Dokumen §6: signature dikirim di header X-Callback-Api-Key (bukan key asli),
// = HMAC-SHA256(raw JSON body) dengan secret = callback_api_key milik kita.
// Match → proses & 200. Mismatch → 401/403.
// =============================================================================

export async function verifyPaymentCallback(
  rawBody: string,
  signatureHeader: string
): Promise<boolean> {
  const config = await getKomercePaymentConfig();
  if (!config.callbackApiKey || !signatureHeader) return false;
  const expected = crypto
    .createHmac("sha256", config.callbackApiKey)
    .update(rawBody, "utf8")
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

// =============================================================================
// UJI KONEKSI — ambil daftar metode (memakai nilai form yang belum tersimpan)
// =============================================================================

export async function testKomercePaymentConnection(
  overrides?: Partial<KomercePaymentConfig>
): Promise<KomercePaymentTestResult> {
  try {
    const methods = await getPaymentMethods(overrides);
    const vaCount = methods.filter((m) => m.paymentType === "va").length;
    const hasQris = methods.some((m) => m.paymentType === "qris");
    return {
      ok: true,
      message: `Koneksi berhasil — ${methods.length} metode pembayaran tersedia (${vaCount} bank VA${hasQris ? " + QRIS" : ""}).`,
      methodsCount: methods.length,
      vaCount,
      hasQris,
      methods,
    };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof KomercePaymentError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Koneksi gagal.",
      methodsCount: 0,
      vaCount: 0,
      hasQris: false,
      methods: [],
    };
  }
}

export { sleep };
