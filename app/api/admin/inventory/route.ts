import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { success, error } from "@/lib/api-response";

export const dynamic = "force-dynamic";

// GET /api/admin/inventory?page=1&limit=20&search=&stock=low
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
    const stock = searchParams.get("stock") || ""; // "low", "out", ""

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }
    if (stock === "low") {
      where.stock = { lte: 5, gt: 0 };
    } else if (stock === "out") {
      where.stock = 0;
    }

    const [products, total] = await db.$transaction([
      db.product.findMany({
        where: where as Prisma.ProductWhereInput,
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          stock: true,
          status: true,
          price: true,
          category: { select: { name: true } },
          images: {
            select: { url: true, isCover: true },
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
          variants: {
            where: { isActive: true },
            select: { id: true, name: true, sku: true, stock: true, isActive: true },
          },
          stockHistory: {
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { type: true, amount: true, before: true, after: true, reason: true, createdAt: true, createdBy: true },
          },
        },
        orderBy: { stock: "asc" },
        skip,
        take: limit,
      }),
      db.product.count({ where: where as Prisma.ProductWhereInput }),
    ]);

    return success({
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        stock: p.stock,
        status: p.status,
        price: p.price,
        category: p.category.name,
        coverImage: p.images.find((i) => i.isCover)?.url ?? p.images[0]?.url ?? null,
        variants: p.variants,
        stockHistory: p.stockHistory,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[GET /api/admin/inventory]", err);
    return error("Failed to fetch inventory", 500);
  }
}
