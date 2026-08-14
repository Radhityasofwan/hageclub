import { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { RelatedArticles } from "@/components/blog/related-articles";
import { NewsletterSection } from "@/components/blog/newsletter-section";
import { ShareButtons } from "@/components/blog/share-buttons";
import { getI18n } from "@/lib/i18n/server";
import { buildMetadata } from "@/lib/seo";
import { buildArticleSchema, buildBreadcrumbSchema } from "@/lib/schema";

interface Props {
  params: Promise<{ slug: string }>;
}

function formatDate(dateStr: string, locale: string = "id"): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale, {
    day: "numeric", month: "long", year: "numeric",
  });
}

function markdownToHtml(md: string): string {
  let html = md
    .replace(/^### (.+)$/gm, "<h3 class='text-lg font-bold mt-6 mb-2'>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2 class='text-xl font-bold mt-8 mb-3'>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1 class='text-2xl font-bold mt-8 mb-4'>$1</h1>")
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code class='bg-accent px-1 rounded text-xs'>$1</code>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline">$1</a>')
    .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded my-4" loading="lazy" />')
    .replace(/^> (.+)$/gm, "<blockquote class='border-l-4 border-border pl-4 italic text-muted my-4'>$1</blockquote>")
    .replace(/^- (.+)$/gm, "<li class='ml-4'>$1</li>")
    .replace(/^\d+\. (.+)$/gm, "<li class='ml-4 list-decimal'>$1</li>")
    .replace(/^---$/gm, "<hr class='my-8 border-border' />")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br />");

  html = html.replace(/((?:<li.*?>.*?<\/li><br \/>?)+)/g, (match) =>
    `<ul class='list-disc pl-5 my-3 space-y-1'>${match.replace(/<br \/>/g, "")}</ul>`
  );

  html = `<p>${html}</p>`;
  html = html.replace(/<p><h([1-3])/g, "<h$1").replace(/<\/h([1-3])><\/p>/g, "</h$1>");
  html = html.replace(/<p><blockquote/g, "<blockquote").replace(/<\/blockquote><\/p>/g, "</blockquote>");
  html = html.replace(/<p><img/g, "<img").replace(/\/><\/p>/g, " />");
  html = html.replace(/<p><hr/g, "<hr").replace(/\/><\/p>/g, " />");

  // Code blocks
  html = html.replace(/<p>```/g, "<pre class='bg-accent rounded p-4 my-4 overflow-x-auto text-sm'><code>");
  html = html.replace(/```<\/p>/g, "</code></pre>");
  html = html.replace(/<pre>([\s\S]*?)<\/pre>/g, (_, code) =>
    `<pre class='bg-accent rounded p-4 my-4 overflow-x-auto text-sm'>${code.replace(/<br \/>/g, "\n")}</pre>`
  );
  html = html.replace(/<p><pre/g, "<pre").replace(/<\/pre><\/p>/g, "</pre>");

  return html;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await db.blogPost.findUnique({
    where: { slug, status: "PUBLISHED" },
    select: { title: true, excerpt: true, seoTitle: true, seoDescription: true, featuredImage: true, slug: true, publishedAt: true },
  });

  if (!post) return { title: "Artikel Tidak Ditemukan" };

  return buildMetadata({
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt ?? "",
    ogImage: post.featuredImage,
    publishedAt: post.publishedAt?.toISOString() ?? null,
  });
}

export const dynamic = "force-dynamic";

export default async function BlogDetailPage({ params }: Props) {
  const { t, locale } = await getI18n();
  const { slug } = await params;
  const post = await db.blogPost.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      category: { select: { name: true, slug: true } },
      author: {
        select: {
          profile: { select: { firstName: true, lastName: true } },
        },
      },
      blogPostTags: {
        include: { tag: { select: { name: true, slug: true } } },
      },
    },
  });

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold">{t("blog.articleNotFound")}</h1>
        <p className="text-sm text-muted mt-2">{t("blog.articleNotFound")}</p>
        <Link href="/blog" className="text-sm text-primary hover:underline mt-4 inline-block">← {t("blog.backToBlog")}</Link>
      </div>
    );
  }

  const author = post.author.profile
    ? `${post.author.profile.firstName} ${post.author.profile.lastName}`.trim()
    : "HAGE CLUB";

  // Get related articles (same category, excluding current)
  const related = await db.blogPost.findMany({
    where: {
      status: "PUBLISHED",
      categoryId: post.categoryId,
      id: { not: post.id },
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
    include: {
      category: { select: { name: true, slug: true } },
      author: {
        select: {
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  const relatedArticles = related.map((r) => ({
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    featuredImage: r.featuredImage,
    category: r.category,
    author: r.author.profile
      ? `${r.author.profile.firstName} ${r.author.profile.lastName}`.trim()
      : "HAGE CLUB",
    publishedAt: r.publishedAt!.toISOString(),
    readingTime: r.readingTime,
  }));

  const pubDate = post.publishedAt?.toISOString() ?? "";
  const tags = post.blogPostTags.map((pt) => pt.tag);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://hageclub.com";
  const articleUrl = `${appUrl}/blog/${post.slug}`;

  // Article JSON-LD
  const articleSchema = buildArticleSchema({
    headline: post.title,
    description: post.excerpt,
    author,
    datePublished: pubDate,
    image: post.featuredImage,
    url: articleUrl,
  });

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: appUrl },
    { name: "Blog", url: `${appUrl}/blog` },
    { name: post.category.name, url: `${appUrl}/blog?category=${post.category.slug}` },
    { name: post.title, url: articleUrl },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: articleSchema }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbSchema }} />
      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="text-xs text-muted mb-6">
          <Link href="/blog" className="hover:text-primary">{t("footer.blog")}</Link>
          <span className="mx-2">/</span>
          <span>{post.category.name}</span>
        </div>

        {/* Cover image */}
        {post.featuredImage && (
          <div className="aspect-[16/9] rounded overflow-hidden mb-8 bg-accent">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Meta */}
        <div className="max-w-[720px] mx-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            {post.category.name}
          </span>
          <h1 className="text-2xl md:text-3xl font-bold mt-2">{post.title}</h1>

          <div className="flex items-center gap-3 text-xs text-muted mt-3 mb-6">
            <span>{author}</span>
            <span>•</span>
            <span>{formatDate(pubDate, locale)}</span>
            <span>•</span>
            <span>{t("blog.readTime", { readingTime: post.readingTime })}</span>
          </div>

          {/* Content */}
          <div
            className="text-sm leading-relaxed space-y-4 [&_p]:my-4"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(post.content) }}
          />

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-border">
              {tags.map((tag) => (
                <Link
                  key={tag.slug}
                  href={`/blog/tag/${tag.slug}`}
                  className="text-xs px-2 py-1 bg-accent rounded hover:bg-accent/70 transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}

          {/* Share */}
          <ShareButtons title={post.title} slug={post.slug} />

          {/* Back link */}
          <div className="mt-6">
            <Link href="/blog" className="text-xs text-muted hover:text-primary transition-colors">
              ← {t("blog.backToBlog")}
            </Link>
          </div>
        </div>

        {/* Related articles */}
        <div className="max-w-[720px] mx-auto">
          <RelatedArticles articles={relatedArticles} />
        </div>

        {/* Newsletter */}
        <div className="mt-10 max-w-[720px] mx-auto">
          <NewsletterSection />
        </div>
      </article>
    </>
  );
}
