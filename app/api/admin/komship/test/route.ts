import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { success, error } from "@/lib/api-response";
import { testKomshipConnection } from "@/lib/komship";
import { z } from "zod";

export const dynamic = "force-dynamic";

const testSchema = z.object({
  apiKey: z.string().max(500).optional(),
  baseUrl: z.string().max(500).optional(),
  shipperDestinationId: z.string().max(50).optional(),
});

// POST /api/admin/komship/test — uji koneksi dengan nilai form saat ini
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

  const result = await testKomshipConnection({
    apiKey: parsed.data.apiKey || undefined,
    baseUrl: parsed.data.baseUrl || undefined,
    shipperDestinationId: parsed.data.shipperDestinationId || undefined,
  });

  return success(result);
}
