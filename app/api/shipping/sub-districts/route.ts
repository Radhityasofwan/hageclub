import { NextRequest, NextResponse } from "next/server";
import { apiResponse } from "@/lib/api-response";
import { getSubDistricts, RajaOngkirError } from "@/lib/rajaongkir";

export async function GET(req: NextRequest) {
  try {
    const districtId = req.nextUrl.searchParams.get("district");
    if (!districtId) {
      return apiResponse.error("district parameter is required", 400);
    }
    const subDistricts = await getSubDistricts(districtId);
    const res = apiResponse.success(subDistricts);
    // Sub-districts rarely change — cache for 24 hours
    const headers = new Headers(res.headers);
    headers.set("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
    return new NextResponse(res.body, { status: res.status, headers });
  } catch (err) {
    console.error("[GET /api/shipping/sub-districts]", err);
    if (err instanceof RajaOngkirError && err.code === "NOT_CONFIGURED") {
      return NextResponse.json(
        { success: false, message: err.message, code: "NOT_CONFIGURED" },
        { status: 503 }
      );
    }
    return apiResponse.error("Failed to fetch sub-districts", 500);
  }
}
