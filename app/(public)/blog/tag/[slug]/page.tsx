import { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { getI18n } from "@/lib/i18n/server";
import { ArticleCard } from "@/components/blog/article-card";
import { NewsletterSection } from "@/components/blog/newsletter-section";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tag = await db.blogTag.findUnique({
    where: { slug },
    select: { name: true },
  });

  if (!tag) return { title: "Tag Tidak Ditemukan" };

  return {
    title: `#${tag.name} — HAGE CLUB Blog`,
    description: `Artikel dengan tag #${tag.name}`,
  };
}

export const dynamic = "force-dynamic";

export default async function BlogTagPage({ params }: Props) {
  const { t } = await getI18n();
  const { slug } = await params;
  const tag = await db.blogTag.findUnique({
    where: { slug },
  });

  if (!tag) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold">{t("blog.tagNotFound")}</h1>
        <Link href="/blog" className="text-sm text-primary hover:underline mt-4 inline-block">← {t("blog.backToBlog")}</Link>
      </div>
    );
  }

  const posts = await db.blogPost.findMany({
    where: {
      status: "PUBLISHED",
      blogPostTags: { some: { tagId: tag.id } },
    },
    orderBy: { publishedAt: "desc" },
    include: {
      category: { select: { name: true, slug: true } },
      author: {
        select: {
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  const articles = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    featuredImage: p.featuredImage,
    category: p.category,
    author: p.author.profile
      ? `${p.author.profile.firstName} ${p.author.profile.lastName}`.trim()
      : "HAGE CLUB",
    publishedAt: p.publishedAt?.toISOString() ?? "",
    readingTime: p.readingTime,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="text-xs text-muted mb-6">
        <Link href="/blog" className="hover:text-primary">{t("footer.blog")}</Link>
        <span className="mx-2">/</span>
        <span>#{tag.name}</span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">#{tag.name}</h1>
        <p className="text-xs text-muted mt-1">{t("blog.articlesCount", { count: articles.length })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.slug} {...article} />
        ))}
      </div>

      {articles.length === 0 && (
        <div className="text-center py-12 text-sm text-muted">
          {t("blog.noArticles")}
        </div>
      )}

      <div className="mt-12">
        <NewsletterSection />
      </div>
    </div>
  );
}
