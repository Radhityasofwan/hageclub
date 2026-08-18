import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error, serverError } from "@/lib/api-response";
import { productSchema, productVariantSchema } from "@/lib/validation";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

// GET /api/admin/products?page=1&limit=20&search=&status=&categoryId=
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return error("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const categoryId = searchParams.get("categoryId") || "";

    const where: Prisma.ProductWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }
    if (status && ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) {
      where.status = status as "DRAFT" | "PUBLISHED" | "ARCHIVED";
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [products, total] = await db.$transaction([
      db.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          price: true,
          salePrice: true,
          stock: true,
          status: true,
          featured: true,
          isNew: true,
          category: { select: { id: true, name: true, active: true } },
          images: {
            select: { url: true, isCover: true },
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [{ category: { active: "desc" } }, { updatedAt: "desc" }],
        skip,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    return success({
      products: products.map((p) => ({
        ...p,
        coverImage: p.images.find((i) => i.isCover)?.url ?? p.images[0]?.url ?? null,
        images: undefined,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return serverError("Failed to fetch products", err);
  }
}

// POST /api/admin/products
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return error("Unauthorized", 401);
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

    // Check slug uniqueness
    const existingSlug = await db.product.findUnique({
      where: { slug: parsed.data.slug },
      select: { id: true },
    });
    if (existingSlug) {
      return error("A product with this slug already exists", 409);
    }

    // Check SKU uniqueness (product-level)
    const existingSku = await db.product.findUnique({
      where: { sku: parsed.data.sku },
      select: { id: true },
    });
    if (existingSku) {
      return error("A product with this SKU already exists", 409);
    }

    // Check variant SKU uniqueness
    const variantSkus = variantsParsed.data.map((v) => v.sku).filter(Boolean);
    if (variantSkus.length > 0) {
      const existingVariantSkus = await db.productVariant.findMany({
        where: { sku: { in: variantSkus } },
        select: { sku: true },
      });
      if (existingVariantSkus.length > 0) {
        const dupes = existingVariantSkus.map((v) => v.sku).join(", ");
        return error(`Variant SKU already exists: ${dupes}`, 409);
      }
    }

    const images = (parsed.data.images ?? []).map((img, i) => ({
      url: img.url,
      alt: img.alt ?? null,
      isCover: img.isCover ?? (i === 0 && (parsed.data.images ?? []).length > 0),
      sortOrder: img.sortOrder ?? i,
    }));

    const product = await db.product.create({
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
        images: images.length > 0 ? { create: images } : undefined,
        variants: variantsParsed.data.length > 0
          ? {
              create: variantsParsed.data.map((v) => ({
                name: v.name,
                sku: v.sku,
                price: v.price ?? null,
                stock: v.stock,
                attributes: v.attributes,
                isActive: v.isActive,
              })),
            }
          : undefined,
      },
      include: { images: true, variants: true },
    });

    revalidateTag("products");
    return success(product, "Product created", 201);
  } catch (err) {
    return serverError("Failed to create product", err);
  }
}
