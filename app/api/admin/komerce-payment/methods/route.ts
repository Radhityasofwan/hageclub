import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { success, error } from "@/lib/api-response";
import {
  getPaymentMethods,
  KomercePaymentError,
} from "@/lib/komerce-payment";

export const dynamic = "force-dynamic";

// GET /api/admin/komerce-payment/methods — daftar metode pembayaran dari Komerce
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return error("Unauthorized", 401);
  }

  try {
    const methods = await getPaymentMethods();
    return success(methods);
  } catch (err) {
    if (err instanceof KomercePaymentError) {
      return error(err.message, err.code === "NOT_CONFIGURED" ? 503 : 502);
    }
    console.error("[GET /api/admin/komerce-payment/methods]", err);
    return error("Gagal mengambil metode pembayaran.", 500);
  }
}
