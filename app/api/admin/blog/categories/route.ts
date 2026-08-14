import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { z } from "zod";

export const dynamic = "force-dynamic";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().nullable().optional(),
});

// GET /api/admin/blog/categories
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return error("Unauthorized", 401);
    }

    const categories = await db.blogCategory.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { posts: true } } },
    });

    return success(categories);
  } catch (err) {
    console.error("[GET /api/admin/blog/categories]", err);
    return error("Failed to fetch categories", 500);
  }
}

// POST /api/admin/blog/categories
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return error("Unauthorized", 401);
    }

    const body = await request.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return error("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const existing = await db.blogCategory.findUnique({
      where: { slug: parsed.data.slug },
    });
    if (existing) return error("A category with this slug already exists", 409);

    const category = await db.blogCategory.create({ data: parsed.data });

    return success(category, "Category created", 201);
  } catch (err) {
    console.error("[POST /api/admin/blog/categories]", err);
    return error("Failed to create category", 500);
  }
}
