import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { success, error } from "@/lib/api-response";
import { testQrislyConnection } from "@/lib/komerce-qrisly";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
});

// POST /api/admin/qrisly/test — uji koneksi memakai nilai form saat ini
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return error("Unauthorized", 401);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return error("Invalid payload", 400, parsed.error.flatten().fieldErrors);
  }

  const result = await testQrislyConnection({
    ...(parsed.data.apiKey ? { apiKey: parsed.data.apiKey } : {}),
    ...(parsed.data.baseUrl ? { baseUrl: parsed.data.baseUrl } : {}),
  });

  return success(result);
}
