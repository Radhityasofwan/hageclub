import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().max(160).nullable().optional(),
  featuredImage: z.string().nullable().optional(),
  categoryId: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED"]).optional(),
  publishedAt: z.string().nullable().optional(),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  seoKeywords: z.string().nullable().optional(),
  readingTime: z.number().int().min(0).optional(),
});

// GET /api/admin/blog/[id]
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
    const post = await db.blogPost.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        author: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        blogPostTags: {
          include: { tag: { select: { id: true, name: true, slug: true } } },
        },
      },
    });

    if (!post) return error("Post not found", 404);

    const mapped = {
      ...post,
      authorName: post.author.profile
        ? `${post.author.profile.firstName} ${post.author.profile.lastName}`.trim()
        : post.author.email,
      tags: post.blogPostTags.map((pt) => pt.tag),
    };

    return success(mapped);
  } catch (err) {
    console.error("[GET /api/admin/blog/[id]]", err);
    return error("Failed to fetch post", 500);
  }
}

// PUT /api/admin/blog/[id]
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
    const existing = await db.blogPost.findUnique({ where: { id } });
    if (!existing) return error("Post not found", 404);

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return error("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const { tags, status, publishedAt, readingTime, ...data } = parsed.data;

    // Calculate reading time from content if content changed
    let calcReadingTime = readingTime;
    if (data.content && !calcReadingTime) {
      calcReadingTime = Math.max(1, Math.ceil(data.content.split(/\s+/).length / 200));
    }

    const updateData: Record<string, unknown> = { ...data };
    if (calcReadingTime) updateData.readingTime = calcReadingTime;
    if (status) updateData.status = status;
    if (publishedAt !== undefined) {
      updateData.publishedAt = publishedAt ? new Date(publishedAt) : null;
    } else if (status === "PUBLISHED" && existing.status !== "PUBLISHED") {
      updateData.publishedAt = new Date();
    }

    // Handle tags
    if (tags) {
      await db.blogPostTag.deleteMany({ where: { blogPostId: id } });
      if (tags.length > 0) {
        const tagRecords = await Promise.all(
          tags.map(async (tagSlug) => {
            const tag = await db.blogTag.upsert({
              where: { slug: tagSlug },
              update: {},
              create: { name: tagSlug, slug: tagSlug },
            });
            return { blogPostId: id, tagId: tag.id };
          })
        );
        await db.blogPostTag.createMany({ data: tagRecords });
      }
    }

    const updated = await db.blogPost.update({
      where: { id },
      data: updateData,
      include: {
        category: { select: { id: true, name: true } },
        author: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        blogPostTags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      },
    });

    return success(updated, "Post updated");
  } catch (err) {
    console.error("[PUT /api/admin/blog/[id]]", err);
    return error("Failed to update post", 500);
  }
}

// DELETE /api/admin/blog/[id]
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
    const existing = await db.blogPost.findUnique({ where: { id } });
    if (!existing) return error("Post not found", 404);

    await db.blogPost.delete({ where: { id } });

    return success(null, "Post deleted");
  } catch (err) {
    console.error("[DELETE /api/admin/blog/[id]]", err);
    return error("Failed to delete post", 500);
  }
}

// PATCH /api/admin/blog/[id]/publish — toggle published/draft
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return error("Unauthorized", 401);
    }

    const { id } = await params;
    const existing = await db.blogPost.findUnique({ where: { id } });
    if (!existing) return error("Post not found", 404);

    const body = await request.json().catch(() => ({}));
    const newStatus: "PUBLISHED" | "DRAFT" = body.publish === false ? "DRAFT" : "PUBLISHED";

    const updated = await db.blogPost.update({
      where: { id },
      data: {
        status: newStatus,
        ...(newStatus === "PUBLISHED" && !existing.publishedAt
          ? { publishedAt: new Date() }
          : {}),
      },
    });

    return success(updated, newStatus === "PUBLISHED" ? "Post published" : "Post unpublished");
  } catch (err) {
    console.error("[PATCH /api/admin/blog/[id]/publish]", err);
    return error("Failed to toggle publish status", 500);
  }
}
