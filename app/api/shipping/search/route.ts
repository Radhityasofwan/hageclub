import { NextRequest, NextResponse } from "next/server";
import { apiResponse } from "@/lib/api-response";
import { searchDestinations, RajaOngkirError } from "@/lib/rajaongkir";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.trim().length < 2) {
    return apiResponse.success([]);
  }

  try {
    const results = await searchDestinations(q);
    return apiResponse.success(results);
  } catch (err) {
    console.error("[GET /api/shipping/search]", err);
    if (err instanceof RajaOngkirError && err.code === "NOT_CONFIGURED") {
      return NextResponse.json(
        { success: false, message: err.message, code: "NOT_CONFIGURED" },
        { status: 503 }
      );
    }
    return apiResponse.error("Failed to search destinations", 500);
  }
}
