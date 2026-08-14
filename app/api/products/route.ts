import { NextRequest } from "next/server";
import { apiResponse } from "@/lib/api-response";
import { getProducts } from "@/lib/queries/product";
import type { ProductFilters } from "@/types/product";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const filters: ProductFilters = {
      category: searchParams.get("category") ?? undefined,
      sort: (searchParams.get("sort") as ProductFilters["sort"]) ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 16,
      inStock: searchParams.get("inStock") === "true" ? true : undefined,
    };

    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    if (minPrice) filters.minPrice = Number(minPrice);
    if (maxPrice) filters.maxPrice = Number(maxPrice);

    const sizes = searchParams.getAll("size");
    if (sizes.length) filters.size = sizes;

    const colors = searchParams.getAll("color");
    if (colors.length) filters.color = colors;

    const result = await getProducts(filters);
    return apiResponse.success(result);
  } catch (err) {
    console.error("[GET /api/products]", err);
    return apiResponse.error("Failed to fetch products", 500);
  }
}
