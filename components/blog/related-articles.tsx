import { getI18n } from "@/lib/i18n/server";
import { ArticleCard } from "@/components/blog/article-card";

interface RelatedArticle {
  slug: string;
  title: string;
  excerpt: string | null;
  featuredImage: string | null;
  category: { name: string; slug: string };
  author: string;
  publishedAt: string;
  readingTime: number;
}

interface RelatedArticlesProps {
  articles: RelatedArticle[];
}

export async function RelatedArticles({ articles }: RelatedArticlesProps) {
  const { t } = await getI18n();
  if (articles.length === 0) return null;

  return (
    <div className="mt-10 pt-8 border-t border-border">
      <h3 className="text-lg font-bold mb-4">{t("blog.relatedArticles")}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.slug} {...article} />
        ))}
      </div>
    </div>
  );
}
