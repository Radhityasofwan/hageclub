import { apiResponse } from "@/lib/api-response";
import { getRajaOngkirSettings } from "@/lib/rajaongkir";

export const dynamic = "force-dynamic";

// Konfigurasi ongkir untuk client components (tanpa secret) — checkout &
// estimator memakai endpoint ini alih-alih mengimpor Prisma ke browser.
export async function GET() {
  const cfg = await getRajaOngkirSettings();
  return apiResponse.success({
    configured: Boolean(cfg.apiKey),
    originCityId: cfg.originCityId,
    originLabel: cfg.originLabel,
    couriers: cfg.couriers,
  });
}
