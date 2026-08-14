import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { success, error } from "@/lib/api-response";
import { testRajaOngkirConnection } from "@/lib/rajaongkir";
import { z } from "zod";

export const dynamic = "force-dynamic";

const testSchema = z.object({
  apiKey: z.string().max(500).optional(),
  baseUrl: z.string().max(500).optional(),
  originCityId: z.string().max(50).optional(),
  couriers: z.array(z.string().max(20)).max(10).optional(),
});

// POST /api/admin/rajaongkir/test — uji koneksi dengan nilai form saat ini
// (belum tentu tersimpan). Override hanya dikirim jika field berubah.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return error("Unauthorized", 401);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = testSchema.safeParse(body);
  if (!parsed.success) {
    return error("Invalid payload", 400, parsed.error.flatten().fieldErrors);
  }

  const result = await testRajaOngkirConnection({
    apiKey: parsed.data.apiKey || undefined,
    baseUrl: parsed.data.baseUrl || undefined,
    originCityId: parsed.data.originCityId || undefined,
    couriers: parsed.data.couriers?.length ? parsed.data.couriers : undefined,
  });

  return success(result);
}
