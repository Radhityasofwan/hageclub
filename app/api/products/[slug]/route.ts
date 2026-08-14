import { NextRequest } from "next/server";
import { apiResponse } from "@/lib/api-response";
import { getProductBySlug } from "@/lib/queries/product";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const product = await getProductBySlug(slug);
    if (!product) return apiResponse.error("Product not found", 404);
    return apiResponse.success(product);
  } catch (err) {
    console.error("[GET /api/products/[slug]]", err);
    return apiResponse.error("Failed to fetch product", 500);
  }
}
