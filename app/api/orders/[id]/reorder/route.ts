import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// Resolve item order ke CartItem dengan data produk/varian TERKINI
// (harga, stok, gambar, berat). Item yang tidak lagi tersedia di-skip;
// item dengan stok kurang dari qty order di-clamp ke stok tersedia.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await db.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) return error("Order not found", 404);
    if (order.status !== "PENDING") {
      return error("Order ini tidak dapat diulang", 400);
    }

    const items: Array<{
      productId: string;
      slug: string;
      variantId: string | null;
      name: string;
      price: number;
      quantity: number;
      imageUrl: string | null;
      sku: string;
      weight: number;
      stock: number;
    }> = [];
    const skipped: Array<{ name: string; reason: string }> = [];

    for (const oi of order.items) {
      const product = await db.product.findUnique({
        where: { id: oi.productId },
        include: { images: { orderBy: { sortOrder: "asc" } } },
      });

      if (!product || product.status !== "PUBLISHED") {
        skipped.push({ name: oi.name, reason: "unavailable" });
        continue;
      }

      let variant: { id: string; name: string; sku: string; price: number | null; stock: number; isActive: boolean } | null = null;
      if (oi.variantId) {
        variant = await db.productVariant.findUnique({ where: { id: oi.variantId } });
        if (!variant || !variant.isActive) {
          skipped.push({ name: oi.name, reason: "unavailable" });
          continue;
        }
      }

      const stock = variant ? variant.stock : product.stock;
      if (stock <= 0) {
        skipped.push({ name: oi.name, reason: "out_of_stock" });
        continue;
      }

      const quantity = Math.min(oi.quantity, stock);
      const price = variant?.price ?? product.salePrice ?? product.price;
      const coverImage =
        product.images.find((img) => img.isCover)?.url ?? product.images[0]?.url ?? null;

      items.push({
        productId: product.id,
        slug: product.slug,
        variantId: variant?.id ?? null,
        name: variant ? `${product.name} — ${variant.name}` : product.name,
        price,
        quantity,
        imageUrl: coverImage,
        sku: variant?.sku ?? product.sku,
        weight: product.weight,
        stock,
      });
    }

    return success({ items, skipped, total: items.length });
  } catch (err) {
    console.error("[POST /api/orders/:id/reorder]", err);
    return error(err instanceof Error ? err.message : "Failed to reorder", 500);
  }
}
