import { NextRequest } from "next/server";
import { apiResponse } from "@/lib/api-response";
import { getInternationalCost } from "@/lib/rajaongkir";
import { internationalCostSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = internationalCostSchema.safeParse(body);
    if (!parsed.success) {
      return apiResponse.error("Invalid request", 400);
    }

    const { origin, destination, weight, couriers } = parsed.data;
    const result = await getInternationalCost(origin, destination, weight, couriers);
    return apiResponse.success(result);
  } catch (err) {
    console.error("[POST /api/shipping/international-cost]", err);
    return apiResponse.error("Failed to calculate international shipping cost", 500);
  }
}
