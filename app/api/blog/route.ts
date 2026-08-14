import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

export const dynamic = "force-dynamic";

// GET /api/blog — published articles only
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(20, Math.max(1, Number(searchParams.get("limit")) || 9));
    const categorySlug = searchParams.get("category") || "";

    const where: Record<string, unknown> = { status: "PUBLISHED" };
    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    const [posts, total] = await Promise.all([
      db.blogPost.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          author: {
            select: {
              profile: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      db.blogPost.count({ where }),
    ]);

    const mapped = posts.map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      featuredImage: p.featuredImage,
      category: p.category,
      author: p.author.profile
        ? `${p.author.profile.firstName} ${p.author.profile.lastName}`.trim()
        : "HAGE CLUB",
      publishedAt: p.publishedAt,
      readingTime: p.readingTime,
    }));

    return success({
      articles: mapped,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[GET /api/blog]", err);
    return error("Failed to fetch articles", 500);
  }
}
