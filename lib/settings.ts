import { db } from "@/lib/db";

// =============================================================================
// IN-MEMORY CACHE (TTL 5 menit — cukup untuk shared hosting tanpa Redis)
// =============================================================================

interface CacheEntry {
  value: string | null;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

// =============================================================================
// ENV FALLBACK (backward-compat saat settings belum diisi di DB)
// =============================================================================

const ENV_FALLBACK: Record<string, string | undefined> = {
  rajaongkir_api_key: process.env.RAJAONGKIR_API_KEY,
  rajaongkir_base_url: process.env.RAJAONGKIR_BASE_URL,
  rajaongkir_origin_city_id: process.env.RAJAONGKIR_ORIGIN_CITY_ID,
  rajaongkir_webhook_secret: process.env.RAJAONGKIR_WEBHOOK_SECRET,
  komship_api_key: process.env.KOMSHIP_API_KEY,
  komship_base_url: process.env.KOMSHIP_BASE_URL,
  komerce_payment_api_key: process.env.KOMERCE_PAYMENT_API_KEY,
  komerce_payment_base_url: process.env.KOMERCE_PAYMENT_BASE_URL,
  komerce_payment_callback_api_key: process.env.KOMERCE_PAYMENT_CALLBACK_API_KEY,
  qrisly_api_key: process.env.QRISLY_API_KEY,
  qrisly_base_url: process.env.QRISLY_BASE_URL,
  analytics_ga4_id: process.env.NEXT_PUBLIC_GA4_ID,
  analytics_meta_pixel_id: process.env.NEXT_PUBLIC_META_PIXEL_ID,
  analytics_gsc_verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION,
  whatsapp_number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  whatsapp_default_message: process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE,
  whatsapp_button_position: process.env.NEXT_PUBLIC_WHATSAPP_POSITION,
  whatsapp_group_url: process.env.NEXT_PUBLIC_WHATSAPP_GROUP_URL,
  email_host: process.env.EMAIL_HOST,
  email_port: process.env.EMAIL_PORT,
  email_secure: process.env.EMAIL_SECURE,
  email_user: process.env.EMAIL_USER,
  email_pass: process.env.EMAIL_PASS,
  email_from_name: process.env.EMAIL_FROM_NAME,
  email_from_address: process.env.EMAIL_FROM,
};

// =============================================================================
// PUBLIC API
// =============================================================================

export async function getSettingValue(key: string): Promise<string | null> {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  try {
    const row = await db.systemSetting.findUnique({ where: { key } });
    const value = row?.value ?? ENV_FALLBACK[key] ?? null;
    cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
  } catch {
    return ENV_FALLBACK[key] ?? null;
  }
}

export async function getSettingValues(keys: string[]): Promise<Record<string, string | null>> {
  const map: Record<string, string | null> = {};
  try {
    const rows = await db.systemSetting.findMany({ where: { key: { in: keys } } });
    for (const key of keys) {
      const row = rows.find((r) => r.key === key);
      map[key] = row?.value ?? ENV_FALLBACK[key] ?? null;
    }
  } catch {
    for (const key of keys) map[key] = ENV_FALLBACK[key] ?? null;
  }
  return map;
}

export async function getAllSettings() {
  return db.systemSetting.findMany({
    orderBy: [{ group: "asc" }, { key: "asc" }],
    select: { key: true, value: true, group: true, label: true, hint: true, isSecret: true, updatedAt: true },
  });
}

export async function updateSettings(
  entries: Array<{ key: string; value: string | null }>,
  updatedBy?: string
): Promise<void> {
  await db.$transaction(
    entries.map(({ key, value }) =>
      db.systemSetting.upsert({
        where: { key },
        update: { value, updatedBy },
        create: { key, value, updatedBy, group: "misc", label: key },
      })
    )
  );
  entries.forEach(({ key }) => cache.delete(key));
}

export async function deleteSettings(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await db.systemSetting.deleteMany({ where: { key: { in: keys } } });
  keys.forEach((k) => cache.delete(k));
}

export function invalidateSettingsCache(keys?: string[]): void {
  if (keys) keys.forEach((k) => cache.delete(k));
  else cache.clear();
}
