import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { success, error } from "@/lib/api-response";
import { registerWebhook } from "@/lib/komship";

export const dynamic = "force-dynamic";

// POST /api/admin/komship/register-webhook — daftarkan URL webhook status
// pengiriman ke Komerce (PUT {base}/webhook, dokumen section 15).
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return error("Unauthorized", 401);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  if (!appUrl) {
    return error("NEXT_PUBLIC_APP_URL belum diatur di .env.local — webhook URL tidak bisa dibuat.", 503);
  }

  const result = await registerWebhook(`${appUrl}/api/shipping/webhook`);
  if (!result.ok) {
    return error(result.message, 502);
  }
  return success({ message: result.message }, result.message);
}
