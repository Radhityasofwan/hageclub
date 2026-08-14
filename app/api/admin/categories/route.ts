import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { z } from "zod";

export const dynamic = "force-dynamic";

const categorySchema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z.string().min(2, "Slug is required"),
  description: z.string().optional().nullable(),
  banner: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  active: z.boolean().optional(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
});

// GET /api/admin/categories
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return error("Unauthorized", 401);
    }

    const categories = await db.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { products: true, children: true } },
      },
    });

    return success(categories);
  } catch (err) {
    console.error("[GET /api/admin/categories]", err);
    return error("Failed to fetch categories", 500);
  }
}

// POST /api/admin/categories
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return error("Unauthorized", 401);
    }

    const body = await request.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return error("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    // Check slug uniqueness
    const existing = await db.category.findUnique({
      where: { slug: parsed.data.slug },
    });
    if (existing) {
      return error("A category with this slug already exists", 409);
    }

    const category = await db.category.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description ?? null,
        banner: parsed.data.banner ?? null,
        parentId: parsed.data.parentId ?? null,
        sortOrder: parsed.data.sortOrder,
        active: parsed.data.active ?? true,
        seoTitle: parsed.data.seoTitle ?? null,
        seoDescription: parsed.data.seoDescription ?? null,
      },
    });

    return success(category, "Category created", 201);
  } catch (err) {
    console.error("[POST /api/admin/categories]", err);
    return error("Failed to create category", 500);
  }
}
