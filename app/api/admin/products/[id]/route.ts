import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error, serverError } from "@/lib/api-response";
import { productSchema, productVariantSchema } from "@/lib/validation";
import { z } from "zod";

// GET /api/admin/products/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return error("Unauthorized", 401);
    }

    const { id } = await params;
    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: "asc" } },
        variants: {
          where: { isActive: true },
          orderBy: { name: "asc" },
        },
        tags: {
          select: { tag: { select: { id: true, name: true } } },
        },
      },
    });

    if (!product) {
      return error("Product not found", 404);
    }

    return success(product);
  } catch (err) {
    return serverError("Failed to fetch product", err);
  }
}

// PUT /api/admin/products/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return error("Unauthorized", 401);
    }

    const { id } = await params;
    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return error("Product not found", 404);
    }

    const body = await request.json();

    // Validate product fields
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return error("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    // Validate variants separately
    const variantsParsed = z.array(productVariantSchema).safeParse(body.variants ?? []);
    if (!variantsParsed.success) {
      return error(
        "Invalid variant data",
        400,
        variantsParsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    // Check slug uniqueness (exclude current)
    if (parsed.data.slug !== existing.slug) {
      const slugExists = await db.product.findUnique({
        where: { slug: parsed.data.slug },
        select: { id: true },
      });
      if (slugExists) {
        return error("A product with this slug already exists", 409);
      }
    }

    // Check SKU uniqueness (exclude current)
    if (parsed.data.sku !== existing.sku) {
      const skuExists = await db.product.findUnique({
        where: { sku: parsed.data.sku },
        select: { id: true },
      });
      if (skuExists) {
        return error("A product with this SKU already exists", 409);
      }
    }

    // Check variant SKU uniqueness (exclude current product's variants)
    const variantSkus = variantsParsed.data.map((v) => v.sku).filter(Boolean);
    if (variantSkus.length > 0) {
      const existingVariantSkus = await db.productVariant.findMany({
        where: {
          sku: { in: variantSkus },
          productId: { not: id },
        },
        select: { sku: true },
      });
      if (existingVariantSkus.length > 0) {
        const dupes = existingVariantSkus.map((v) => v.sku).join(", ");
        return error(`Variant SKU already in use: ${dupes}`, 409);
      }
    }

    const images = (parsed.data.images ?? []).map((img, i) => ({
      url: img.url,
      alt: img.alt ?? null,
      isCover: img.isCover ?? (i === 0 && (parsed.data.images ?? []).length > 0),
      sortOrder: img.sortOrder ?? i,
    }));

    // Update product + images + variants in a transaction
    const product = await db.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: {
          name: parsed.data.name,
          slug: parsed.data.slug,
          sku: parsed.data.sku,
          shortDescription: parsed.data.shortDescription ?? null,
          fullDescription: parsed.data.fullDescription ?? null,
          sizeGuideImageUrl: parsed.data.sizeGuideImageUrl ?? null,
          price: parsed.data.price,
          salePrice: parsed.data.salePrice ?? null,
          weight: parsed.data.weight,
          width: parsed.data.width ?? null,
          height: parsed.data.height ?? null,
          length: parsed.data.length ?? null,
          status: parsed.data.status,
          stock: variantsParsed.data.length > 0
            ? variantsParsed.data.filter((v) => v.isActive).reduce((s, v) => s + v.stock, 0)
            : parsed.data.stock,
          featured: parsed.data.featured,
          isNew: parsed.data.isNew,
          categoryId: parsed.data.categoryId,
          seoTitle: parsed.data.seoTitle ?? null,
          seoDescription: parsed.data.seoDescription ?? null,
          seoKeywords: parsed.data.seoKeywords ?? null,
          images: {
            deleteMany: {},
            create: images,
          },
        },
      });

      // Replace variants: delete all, re-create from submitted list
      await tx.productVariant.deleteMany({ where: { productId: id } });

      if (variantsParsed.data.length > 0) {
        await tx.productVariant.createMany({
          data: variantsParsed.data.map((v) => ({
            productId: id,
            name: v.name,
            sku: v.sku,
            price: v.price ?? null,
            stock: v.stock,
            attributes: v.attributes,
            isActive: v.isActive,
          })),
        });
      }

      return updated;
    });

    return success(product, "Product updated");
  } catch (err) {
    return serverError("Failed to update product", err);
  }
}

// DELETE /api/admin/products/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return error("Unauthorized", 401);
    }

    const { id } = await params;
    const existing = await db.product.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return error("Product not found", 404);
    }

    await db.product.delete({ where: { id } });

    return success(null, "Product deleted");
  } catch (err) {
    return serverError("Failed to delete product", err);
  }
}
