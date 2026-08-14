import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

const blogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().max(160).nullable().optional(),
  featuredImage: z.string().nullable().optional(),
  categoryId: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED"]),
  publishedAt: z.string().nullable().optional(),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  seoKeywords: z.string().nullable().optional(),
  readingTime: z.number().int().min(0).optional(),
});

// GET /api/admin/blog
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return error("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";

    const where: Prisma.BlogPostWhereInput = {};
    if (status && ["DRAFT", "PUBLISHED", "SCHEDULED"].includes(status)) {
      where.status = status as "DRAFT" | "PUBLISHED" | "SCHEDULED";
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { excerpt: { contains: search } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;

    const [posts, total] = await Promise.all([
      db.blogPost.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
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
      }),
      db.blogPost.count({ where }),
    ]);

    const mapped = posts.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      featuredImage: p.featuredImage,
      status: p.status,
      publishedAt: p.publishedAt,
      readingTime: p.readingTime,
      createdAt: p.createdAt,
      category: p.category,
      author: p.author.profile
        ? `${p.author.profile.firstName} ${p.author.profile.lastName}`.trim()
        : p.author.email,
      tags: p.blogPostTags.map((pt) => pt.tag),
    }));

    return success({
      posts: mapped,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[GET /api/admin/blog]", err);
    return error("Failed to fetch posts", 500);
  }
}

// POST /api/admin/blog
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return error("Unauthorized", 401);
    }

    const body = await request.json();
    const parsed = blogPostSchema.safeParse(body);
    if (!parsed.success) {
      return error("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const { tags, status, publishedAt, readingTime, ...data } = parsed.data;

    // Calculate reading time from content if not provided
    const calcReadingTime = readingTime ?? Math.max(1, Math.ceil(data.content.split(/\s+/).length / 200));

    const post = await db.blogPost.create({
      data: {
        ...data,
        readingTime: calcReadingTime,
        authorId: session.user.id,
        status: status as "DRAFT" | "PUBLISHED" | "SCHEDULED",
        publishedAt: publishedAt ? new Date(publishedAt) : status === "PUBLISHED" ? new Date() : null,
        blogPostTags: tags?.length
          ? {
              create: await Promise.all(
                tags.map(async (tagSlug) => {
                  const tag = await db.blogTag.upsert({
                    where: { slug: tagSlug },
                    update: {},
                    create: { name: tagSlug, slug: tagSlug },
                  });
                  return { tagId: tag.id };
                })
              ),
            }
          : undefined,
      },
      include: {
        category: { select: { id: true, name: true } },
        author: {
          select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } },
        },
        blogPostTags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      },
    });

    return success(post, "Post created", 201);
  } catch (err) {
    console.error("[POST /api/admin/blog]", err);
    return error("Failed to create post", 500);
  }
}
