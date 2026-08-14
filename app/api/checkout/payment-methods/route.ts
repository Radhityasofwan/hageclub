import { apiResponse } from "@/lib/api-response";
import { getPaymentMethods, KomercePaymentError } from "@/lib/komerce-payment";

export const dynamic = "force-dynamic";

// GET /api/checkout/payment-methods — daftar metode pembayaran untuk halaman checkout (publik)
export async function GET() {
  try {
    const methods = await getPaymentMethods();
    return apiResponse.success(methods);
  } catch (err) {
    if (err instanceof KomercePaymentError && err.code === "NOT_CONFIGURED") {
      return apiResponse.success([]);
    }
    console.error("[GET /api/checkout/payment-methods]", err);
    return apiResponse.success([]);
  }
}
