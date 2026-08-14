import { NextRequest, NextResponse } from "next/server";
import { apiResponse } from "@/lib/api-response";
import { getCities, RajaOngkirError } from "@/lib/rajaongkir";

export async function GET(req: NextRequest) {
  try {
    const provinceId = req.nextUrl.searchParams.get("province");
    if (!provinceId) {
      return apiResponse.error("province parameter is required", 400);
    }
    const cities = await getCities(provinceId);
    const res = apiResponse.success(cities);
    // Cities rarely change — cache for 24 hours
    const headers = new Headers(res.headers);
    headers.set("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
    return new NextResponse(res.body, { status: res.status, headers });
  } catch (err) {
    console.error("[GET /api/shipping/cities]", err);
    if (err instanceof RajaOngkirError && err.code === "NOT_CONFIGURED") {
      return NextResponse.json(
        { success: false, message: err.message, code: "NOT_CONFIGURED" },
        { status: 503 }
      );
    }
    return apiResponse.error("Failed to fetch cities", 500);
  }
}
