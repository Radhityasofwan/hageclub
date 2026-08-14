import { apiResponse } from "@/lib/api-response";
import { getCategories } from "@/lib/queries/product";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const categories = await getCategories();
    const res = apiResponse.success(categories);
    // Cache for 1 hour — categories rarely change
    const headers = new Headers(res.headers);
    headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return new NextResponse(res.body, { status: res.status, headers });
  } catch (err) {
    console.error("[GET /api/categories]", err);
    return apiResponse.error("Failed to fetch categories", 500);
  }
}
