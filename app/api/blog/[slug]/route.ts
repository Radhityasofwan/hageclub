import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

export const dynamic = "force-dynamic";

// GET /api/blog/[slug]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const post = await db.blogPost.findUnique({
      where: { slug, status: "PUBLISHED" },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: {
          select: {
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        blogPostTags: {
          include: { tag: { select: { id: true, name: true, slug: true } } },
        },
      },
    });

    if (!post) return error("Article not found", 404);

    const mapped = {
      slug: post.slug,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      featuredImage: post.featuredImage,
      category: post.category,
      author: post.author.profile
        ? `${post.author.profile.firstName} ${post.author.profile.lastName}`.trim()
        : "HAGE CLUB",
      publishedAt: post.publishedAt,
      readingTime: post.readingTime,
      tags: post.blogPostTags.map((pt) => pt.tag),
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
    };

    return success(mapped);
  } catch (err) {
    console.error("[GET /api/blog/[slug]]", err);
    return error("Failed to fetch article", 500);
  }
}
