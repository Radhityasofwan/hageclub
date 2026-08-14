import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { z } from "zod";

const adjustSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional().nullable(),
  type: z.enum(["ADD", "SUBTRACT", "SET"]),
  amount: z.number().int().positive(),
  reason: z.string().optional(),
});

// POST /api/admin/inventory/adjust
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return error("Unauthorized", 401);
    }

    const body = await request.json();
    const parsed = adjustSchema.safeParse(body);
    if (!parsed.success) {
      return error("Invalid adjustment data", 400, parsed.error.flatten().fieldErrors);
    }

    const { productId, variantId, type, amount, reason } = parsed.data;

    const product = await db.product.findUnique({
      where: { id: productId },
      select: { id: true, stock: true },
    });
    if (!product) {
      return error("Product not found", 404);
    }

    let variant;
    if (variantId) {
      variant = await db.productVariant.findUnique({
        where: { id: variantId },
        select: { id: true, stock: true },
      });
      if (!variant) {
        return error("Variant not found", 404);
      }
    }

    const productBefore = product.stock;
    let productAfter: number;
    let variantBefore: number | null = null;
    let variantAfter: number | null = null;

    switch (type) {
      case "ADD":
        productAfter = productBefore + amount;
        break;
      case "SUBTRACT":
        productAfter = Math.max(0, productBefore - amount);
        break;
      case "SET":
        productAfter = amount;
        break;
    }

    // Update product stock
    await db.product.update({
      where: { id: productId },
      data: { stock: productAfter },
    });

    // Update variant stock if specified
    if (variant && variantId) {
      switch (type) {
        case "ADD":
          variantAfter = variant.stock + amount;
          break;
        case "SUBTRACT":
          variantAfter = Math.max(0, variant.stock - amount);
          break;
        case "SET":
          variantAfter = Number(reason) || amount; // if SET, use amount as the new value
          break;
      }
      await db.productVariant.update({
        where: { id: variantId },
        data: { stock: variantAfter! },
      });
      variantBefore = variant.stock;
    }

    // Record stock history
    await db.stockHistory.create({
      data: {
        productId,
        variantId: variantId ?? null,
        type,
        amount,
        before: variantBefore ?? productBefore,
        after: variantAfter ?? productAfter,
        reason: reason ?? null,
        createdBy: session.user.id,
      },
    });

    return success(
      {
        productId,
        variantId: variantId ?? null,
        before: variantBefore ?? productBefore,
        after: variantAfter ?? productAfter,
        type,
      },
      "Stock adjusted"
    );
  } catch (err) {
    console.error("[POST /api/admin/inventory/adjust]", err);
    return error("Failed to adjust stock", 500);
  }
}
