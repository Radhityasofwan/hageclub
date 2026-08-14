import { getSettingValues } from "@/lib/settings";
import {
  DEFAULT_QRISLY_BASE_URL,
  QRISLY_ENVIRONMENTS,
} from "@/lib/komerce-qrisly-constants";
import type {
  KomerceQrislyGenerateResult,
  KomerceQrislyStatusResult,
  KomerceQrislyTestResult,
  KomerceQrislyUploadResult,
} from "@/types";

// =============================================================================
// QRISLY API — dynamic QRIS dari QRIS statis
// (dokumentasi resmi: API-Qrisly.md di root proyek)
// Base URL: https://api.collaborator.komerce.id/user (production)
//           https://api-sandbox.collaborator.komerce.id/user (sandbox)
// Auth: header x-api-key
// =============================================================================

export interface KomerceQrislyConfig {
  apiKey: string;
  baseUrl: string;
  /** qris_id hasil upload QRIS statis (dipakai semua transaksi) */
  qrisId: string;
  merchantName: string | null;
  provider: string | null;
}

async function getQrislyConfig(): Promise<KomerceQrislyConfig> {
  const cfg = await getSettingValues([
    "komerce_environment",
    "qrisly_api_key",
    "qrisly_base_url",
    "qrisly_qris_id",
    "qrisly_merchant_name",
    "qrisly_provider",
  ]);
  // komerce_environment (shared) wins; falls back to individual base_url
  const sharedEnv = cfg.komerce_environment as string | null;
  const resolvedBaseUrl =
    sharedEnv === "production" ? QRISLY_ENVIRONMENTS.production.baseUrl
    : sharedEnv === "sandbox" ? QRISLY_ENVIRONMENTS.sandbox.baseUrl
    : (cfg.qrisly_base_url ?? DEFAULT_QRISLY_BASE_URL);
  return {
    apiKey: cfg.qrisly_api_key ?? "",
    baseUrl: resolvedBaseUrl.replace(/\/+$/, ""),
    qrisId: cfg.qrisly_qris_id ?? "",
    merchantName: cfg.qrisly_merchant_name,
    provider: cfg.qrisly_provider,
  };
}

/** Baca konfigurasi untuk server-side (admin page, routes) */
export async function getQrislySettings(): Promise<KomerceQrislyConfig> {
  return getQrislyConfig();
}

/** Lengkap bila API key + QRIS statis sudah terpasang */
export async function isQrislyConfigured(): Promise<boolean> {
  const cfg = await getQrislyConfig();
  return Boolean(cfg.apiKey && cfg.baseUrl && cfg.qrisId);
}

// =============================================================================
// ERROR MODEL — kode sama dengan RajaOngkir/Komship/Payment agar UI konsisten
// =============================================================================

export type QrislyErrorCode =
  | "NOT_CONFIGURED"
  | "HTTP_ERROR"
  | "UPSTREAM_ERROR"
  | "INVALID_RESPONSE";

export class QrislyError extends Error {
  code: QrislyErrorCode;
  status?: number;

  constructor(code: QrislyErrorCode, message: string, status?: number) {
    super(message);
    this.name = "QrislyError";
    this.code = code;
    this.status = status;
  }
}

// =============================================================================
// QRISLY FETCH — header x-api-key. Envelope QRISLY tidak konsisten:
// upload/generate → { success, message, data }; status → { meta, data }.
// Error: { success:false, message, error_code } | { message, code, status:"error" }
// =============================================================================

async function qrislyFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  configOverride?: Partial<KomerceQrislyConfig>
): Promise<T> {
  const saved = await getQrislyConfig();
  const config = configOverride ? { ...saved, ...configOverride } : saved;

  if (!config.apiKey) {
    throw new QrislyError(
      "NOT_CONFIGURED",
      "API key QRISLY belum dikonfigurasi. Isi di panel admin → Settings → QRISLY."
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
    const text = await response.text();
    throw new QrislyError(
      "HTTP_ERROR",
      `QRISLY API error ${response.status}: ${text}`,
      response.status
    );
  }

  let json: {
    success?: boolean;
    message?: string;
    code?: number;
    status?: string;
    error_code?: string;
    meta?: { message?: string; code?: number; status?: string };
    data?: T;
  };
  try {
    json = await response.json();
  } catch {
    throw new QrislyError("INVALID_RESPONSE", "Respons QRISLY bukan JSON yang valid.");
  }

  if (json.success === false) {
    throw new QrislyError(
      "UPSTREAM_ERROR",
      json.message ?? json.error_code ?? "QRISLY API error"
    );
  }
  if (json.meta && json.meta.code !== 200) {
    throw new QrislyError(
      "UPSTREAM_ERROR",
      json.meta.message ?? "QRISLY API error"
    );
  }
  if (json.status === "error" || (typeof json.code === "number" && json.code !== 200)) {
    throw new QrislyError("UPSTREAM_ERROR", json.message ?? "QRISLY API error");
  }

  if (json.data === undefined) {
    throw new QrislyError("INVALID_RESPONSE", "Respons QRISLY tidak valid.");
  }

  return json.data;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

// =============================================================================
// POST /api/v1/qrisly/upload-qris — upload QRIS statis (sekali, dipakai ulang)
// multipart/form-data: name (≤100 char) + qris_image (PNG/JPG, maks 5MB)
// =============================================================================

export interface UploadQrisImageParams {
  /** identity QRIS — maks 100 karakter */
  name: string;
  image: Buffer;
  mimeType: string;
  filename?: string;
}

export async function uploadQrisImage(
  params: UploadQrisImageParams,
  configOverride?: Partial<KomerceQrislyConfig>
): Promise<KomerceQrislyUploadResult> {
  const form = new FormData();
  form.append("name", params.name);
  form.append(
    "qris_image",
    new Blob([new Uint8Array(params.image)], { type: params.mimeType }),
    params.filename ?? `qris.${params.mimeType === "image/png" ? "png" : "jpg"}`
  );

  const data = await qrislyFetch<Record<string, unknown>>(
    "/api/v1/qrisly/upload-qris",
    { method: "POST", body: form },
    configOverride
  );

  const qrisId = (data.qris_id ?? "") as string;
  if (!qrisId) {
    throw new QrislyError(
      "INVALID_RESPONSE",
      "QRISLY tidak mengembalikan qris_id pada hasil upload."
    );
  }

  return {
    qrisId,
    provider: (data.provider ?? null) as string | null,
    name: (data.name ?? params.name) as string,
    merchantName: (data.merchant_name ?? null) as string | null,
    createdAt: (data.created_at ?? null) as string | null,
    raw: data,
  };
}

// =============================================================================
// POST /api/v1/qrisly/generate-qris — QRIS dinamis per transaksi
// Biaya IDR 100/generate. unique_amount menambahkan nominal unik (default true).
// Expiry 15 menit (server-side, tidak bisa diubah).
// =============================================================================

export interface GenerateQrisParams {
  qrisId: string;
  /** minimal Rp 1.000 (dokumen bagian 4) */
  amount: number;
  outputType?: "string" | "image";
  uniqueAmount?: boolean;
}

export async function generateQris(
  params: GenerateQrisParams,
  configOverride?: Partial<KomerceQrislyConfig>
): Promise<KomerceQrislyGenerateResult> {
  const payload: Record<string, unknown> = {
    qris_id: Number(params.qrisId) || params.qrisId,
    amount: Math.max(1000, Math.round(params.amount)),
    output_type: params.outputType ?? "string",
    unique_amount: params.uniqueAmount ?? true,
  };

  const data = await qrislyFetch<Record<string, unknown>>(
    "/api/v1/qrisly/generate-qris",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    configOverride
  );

  const historyId = (data.history_id ?? "") as string;
  if (!historyId) {
    throw new QrislyError(
      "INVALID_RESPONSE",
      "QRISLY tidak mengembalikan history_id. (Periksa saldo wallet — generate berbayar IDR 100.)"
    );
  }

  return {
    historyId: String(historyId),
    qrisString: (data.qris_string ?? "") as string,
    originalAmount: toNumber(data.original_amount),
    finalAmount: toNumber(data.final_amount),
    paymentStatus: (data.payment_status ?? null) as string | null,
    expiryTime: (data.expiry_time ?? null) as string | null,
    raw: data,
  };
}

// =============================================================================
// GET /api/v1/qrisly/payment-status/{history_id}
// Status: unpaid | paid | expired | cancelled (lowercase). Gratis dipanggil.
// =============================================================================

export async function getQrislyPaymentStatus(
  historyId: string
): Promise<KomerceQrislyStatusResult> {
  const data = await qrislyFetch<Record<string, unknown>>(
    `/api/v1/qrisly/payment-status/${encodeURIComponent(historyId)}`
  );

  const raw = ((data.payment_status ?? "unpaid") as string).toLowerCase();
  const status: KomerceQrislyStatusResult["status"] = (
    ["unpaid", "paid", "expired", "cancelled"] as const
  ).includes(raw as KomerceQrislyStatusResult["status"])
    ? (raw as KomerceQrislyStatusResult["status"])
    : "unpaid";

  return {
    historyId: String(data.history_id ?? historyId),
    status,
    amount: toNumber(data.amount),
    name: (data.name ?? null) as string | null,
    paidAt: (data.paid_at ?? null) as string | null,
    createdAt: (data.created_at ?? null) as string | null,
    updatedAt: (data.updated_at ?? null) as string | null,
    raw: data,
  };
}

// =============================================================================
// STATUS MAPPING — QRISLY (unpaid/paid/expired/cancelled) → enum lokal
// =============================================================================

export type LocalPaymentStatus = "PENDING" | "PAID" | "EXPIRED" | "FAILED";

export function mapQrislyStatus(
  status: string
): LocalPaymentStatus {
  const s = status.toLowerCase();
  if (s === "paid") return "PAID";
  if (s === "expired") return "EXPIRED";
  if (s === "cancelled") return "FAILED";
  return "PENDING";
}

export function mapQrislyOrderStatus(status: string): "PENDING" | "PAID" | "CANCELLED" {
  const s = status.toLowerCase();
  if (s === "paid") return "PAID";
  if (s === "expired" || s === "cancelled") return "CANCELLED";
  return "PENDING";
}

// =============================================================================
// UJI KONEKSI — cek validitas API key via status endpoint (GRATIS).
// Sengaja TIDAK memanggil generate-qris karena berbayar (IDR 100/kali).
// 401/403 → key invalid; 200/400/404 → key valid (history tak ditemukan).
// =============================================================================

export async function testQrislyConnection(
  overrides?: { apiKey?: string; baseUrl?: string }
): Promise<KomerceQrislyTestResult> {
  const saved = await getQrislyConfig();
  const apiKey = overrides?.apiKey?.trim() || saved.apiKey;
  const baseUrl = (overrides?.baseUrl?.trim() || saved.baseUrl).replace(/\/+$/, "");

  if (!apiKey) {
    return {
      ok: false,
      message: "API Key belum diisi. Isi API Key terlebih dahulu, lalu uji lagi.",
      hasQrisId: Boolean(saved.qrisId),
      qrisId: saved.qrisId || null,
      merchantName: saved.merchantName,
      provider: saved.provider,
    };
  }

  let status = 0;
  let text = "";
  try {
    const res = await fetch(`${baseUrl}/api/v1/qrisly/payment-status/0`, {
      headers: { "x-api-key": apiKey },
    });
    status = res.status;
    text = (await res.text()).slice(0, 300);
  } catch (err) {
    return {
      ok: false,
      message: `Gagal terhubung ke QRISLY: ${err instanceof Error ? err.message : "network error"}`,
      hasQrisId: Boolean(saved.qrisId),
      qrisId: saved.qrisId || null,
      merchantName: saved.merchantName,
      provider: saved.provider,
    };
  }

  if (status === 401 || status === 403) {
    return {
      ok: false,
      message: `API key tidak valid (HTTP ${status}). Periksa key di dashboard RajaOngkir — pastikan tanpa spasi ekstra.`,
      hasQrisId: Boolean(saved.qrisId),
      qrisId: saved.qrisId || null,
      merchantName: saved.merchantName,
      provider: saved.provider,
    };
  }

  if (status === 200 || status === 400 || status === 404) {
    return {
      ok: true,
      message: saved.qrisId
        ? "Koneksi berhasil — API key valid dan QRIS statis sudah terpasang."
        : "Koneksi berhasil — API key valid. Upload QRIS statis untuk melengkapi konfigurasi.",
      hasQrisId: Boolean(saved.qrisId),
      qrisId: saved.qrisId || null,
      merchantName: saved.merchantName,
      provider: saved.provider,
    };
  }

  return {
    ok: false,
    message: `Respons tak terduga (HTTP ${status}): ${text}`,
    hasQrisId: Boolean(saved.qrisId),
    qrisId: saved.qrisId || null,
    merchantName: saved.merchantName,
    provider: saved.provider,
  };
}

/** Environment terpilih dari base URL (untuk UI admin) */
export function getQrislyEnvironment(baseUrl: string) {
  const clean = baseUrl.replace(/\/+$/, "");
  for (const env of Object.values(QRISLY_ENVIRONMENTS)) {
    if (clean === env.baseUrl.replace(/\/+$/, "")) return env;
  }
  return null;
}
