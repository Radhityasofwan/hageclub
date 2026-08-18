import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional().nullable(),
  banner: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  active: z.boolean().optional(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
});

// PUT /api/admin/categories/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return error("Unauthorized", 401);
    }

    const { id } = await params;
    const existing = await db.category.findUnique({ where: { id } });
    if (!existing) {
      return error("Category not found", 404);
    }

    const body = await request.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return error("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    // Check slug uniqueness
    if (parsed.data.slug !== existing.slug) {
      const slugExists = await db.category.findUnique({
        where: { slug: parsed.data.slug },
      });
      if (slugExists) {
        return error("A category with this slug already exists", 409);
      }
    }

    const category = await db.category.update({
      where: { id },
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description ?? null,
        banner: parsed.data.banner ?? null,
        parentId: parsed.data.parentId ?? null,
        sortOrder: parsed.data.sortOrder,
        active: parsed.data.active ?? existing.active,
        seoTitle: parsed.data.seoTitle ?? null,
        seoDescription: parsed.data.seoDescription ?? null,
      },
    });

    revalidateTag("categories");
    return success(category, "Category updated");
  } catch (err) {
    console.error("[PUT /api/admin/categories/[id]]", err);
    return error("Failed to update category", 500);
  }
}

// PATCH /api/admin/categories/[id] — partial update (active, banner)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return error("Unauthorized", 401);
    }

    const { id } = await params;
    const existing = await db.category.findUnique({ where: { id } });
    if (!existing) {
      return error("Category not found", 404);
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.active !== undefined) {
      data.active = Boolean(body.active);
    }
    if ("banner" in body) {
      data.banner = body.banner || null;
    }

    const category = await db.category.update({ where: { id }, data });

    revalidateTag("categories");
    return success(category, "Category updated");
  } catch (err) {
    console.error("[PATCH /api/admin/categories/[id]]", err);
    return error("Failed to update category", 500);
  }
}

// DELETE /api/admin/categories/[id]
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
    const existing = await db.category.findUnique({
      where: { id },
      select: {
        id: true,
        _count: { select: { products: true, children: true } },
      },
    });
    if (!existing) {
      return error("Category not found", 404);
    }

    if (existing._count.products > 0) {
      return error(
        `Cannot delete: ${existing._count.products} product(s) are in this category`,
        400
      );
    }

    if (existing._count.children > 0) {
      return error(
        `Cannot delete: ${existing._count.children} subcategory(ies) exist`,
        400
      );
    }

    await db.category.delete({ where: { id } });
    revalidateTag("categories");
    return success(null, "Category deleted");
  } catch (err) {
    console.error("[DELETE /api/admin/categories/[id]]", err);
    return error("Failed to delete category", 500);
  }
}
