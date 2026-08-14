import { NextRequest } from "next/server";
import { apiResponse } from "@/lib/api-response";
import { getCost } from "@/lib/rajaongkir";
import { shippingCostSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = shippingCostSchema.safeParse(body);
    if (!parsed.success) {
      return apiResponse.error("Invalid request", 400);
    }

    const { origin, destination, weight, couriers } = parsed.data;
    const result = await getCost(origin, destination, weight, couriers);
    return apiResponse.success(result);
  } catch (err) {
    console.error("[POST /api/shipping/cost]", err);
    return apiResponse.error("Failed to calculate shipping cost", 500);
  }
}
