import { NextResponse } from "next/server";
import { apiResponse } from "@/lib/api-response";
import { getProvinces, RajaOngkirError } from "@/lib/rajaongkir";

export async function GET() {
  try {
    const provinces = await getProvinces();
    const res = apiResponse.success(provinces);
    // Provinces never change — cache for 24 hours
    const headers = new Headers(res.headers);
    headers.set("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
    return new NextResponse(res.body, { status: res.status, headers });
  } catch (err) {
    console.error("[GET /api/shipping/provinces]", err);
    if (err instanceof RajaOngkirError && err.code === "NOT_CONFIGURED") {
      return NextResponse.json(
        { success: false, message: err.message, code: "NOT_CONFIGURED" },
        { status: 503 }
      );
    }
    return apiResponse.error("Failed to fetch provinces", 500);
  }
}
