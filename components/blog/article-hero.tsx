import Link from "next/link";

interface ArticleHeroProps {
  slug: string;
  title: string;
  excerpt: string | null;
  featuredImage: string | null;
  category: { name: string; slug: string };
  author: string;
  publishedAt: string;
  readingTime: number;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export function ArticleHero({
  slug, title, excerpt, featuredImage, category, author, publishedAt, readingTime,
}: ArticleHeroProps) {
  return (
    <Link href={`/blog/${slug}`} className="group block">
      <article className="relative rounded overflow-hidden bg-primary min-h-[320px] md:min-h-[400px]">
        {/* Background image */}
        {featuredImage ? (
          <img
            src={featuredImage}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-end h-full p-6 md:p-10">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">
            {category.name}
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-white mt-1 group-hover:underline decoration-white/50 underline-offset-4">
            {title}
          </h2>
          {excerpt && (
            <p className="text-sm text-white/70 mt-2 max-w-2xl line-clamp-2">{excerpt}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-white/60 mt-3">
            <span>{author}</span>
            <span>•</span>
            <span>{formatDate(publishedAt)}</span>
            <span>•</span>
            <span>{readingTime} menit baca</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
