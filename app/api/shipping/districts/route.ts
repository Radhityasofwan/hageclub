import { NextRequest, NextResponse } from "next/server";
import { apiResponse } from "@/lib/api-response";
import { getDistricts, RajaOngkirError } from "@/lib/rajaongkir";

export async function GET(req: NextRequest) {
  try {
    const cityId = req.nextUrl.searchParams.get("city");
    if (!cityId) {
      return apiResponse.error("city parameter is required", 400);
    }
    const districts = await getDistricts(cityId);
    const res = apiResponse.success(districts);
    // Districts rarely change — cache for 24 hours
    const headers = new Headers(res.headers);
    headers.set("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
    return new NextResponse(res.body, { status: res.status, headers });
  } catch (err) {
    console.error("[GET /api/shipping/districts]", err);
    if (err instanceof RajaOngkirError && err.code === "NOT_CONFIGURED") {
      return NextResponse.json(
        { success: false, message: err.message, code: "NOT_CONFIGURED" },
        { status: 503 }
      );
    }
    return apiResponse.error("Failed to fetch districts", 500);
  }
}
