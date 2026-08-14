import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
});

// PUT /api/admin/blog/categories/[id]
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
    const existing = await db.blogCategory.findUnique({ where: { id } });
    if (!existing) return error("Category not found", 404);

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return error("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    if (parsed.data.slug && parsed.data.slug !== existing.slug) {
      const slugExists = await db.blogCategory.findUnique({
        where: { slug: parsed.data.slug },
      });
      if (slugExists) return error("Slug already in use", 409);
    }

    const category = await db.blogCategory.update({
      where: { id },
      data: parsed.data,
    });

    return success(category, "Category updated");
  } catch (err) {
    console.error("[PUT /api/admin/blog/categories/[id]]", err);
    return error("Failed to update category", 500);
  }
}

// DELETE /api/admin/blog/categories/[id]
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
    const existing = await db.blogCategory.findUnique({
      where: { id },
      include: { _count: { select: { posts: true } } },
    });
    if (!existing) return error("Category not found", 404);
    if (existing._count.posts > 0) {
      return error(`Cannot delete category with ${existing._count.posts} posts. Move them first.`, 400);
    }

    await db.blogCategory.delete({ where: { id } });

    return success(null, "Category deleted");
  } catch (err) {
    console.error("[DELETE /api/admin/blog/categories/[id]]", err);
    return error("Failed to delete category", 500);
  }
}
