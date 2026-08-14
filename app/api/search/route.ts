import { NextRequest } from "next/server";
import { apiResponse } from "@/lib/api-response";
import { searchProducts } from "@/lib/queries/product";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
      return apiResponse.success([]);
    }
    const results = await searchProducts(q, 10);
    return apiResponse.success(results);
  } catch (err) {
    console.error("[GET /api/search]", err);
    return apiResponse.error("Search failed", 500);
  }
}
