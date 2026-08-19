export interface BrandStoryContent {
  image?: string;
  body?: string;
  ctaText?: string;
  ctaLink?: string;
  imagePosition?: "left" | "right";
}

interface Props {
  title?: string | null;
  subtitle?: string | null;
  content: BrandStoryContent | null;
}

export function BrandStorySection({ title, subtitle, content }: Props) {
  const c = content ?? {};
  const isImageRight = c.imagePosition === "right";

  if (!c.body && !title) return null;

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${isImageRight ? "" : "direction-rtl"}`}>
          {/* Image */}
          {c.image && (
            <div className="relative aspect-[4/3] rounded overflow-hidden bg-accent order-first lg:order-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.image}
                alt={title ?? "Brand story"}
                width={800}
                height={600}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className={c.image ? "" : "col-span-full max-w-2xl mx-auto text-center"}>
            {title && (
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm text-muted mt-2 uppercase tracking-widest">{subtitle}</p>
            )}
            {c.body && (
              <div className="mt-6 text-sm text-muted leading-relaxed whitespace-pre-line">
                {c.body}
              </div>
            )}
            {c.ctaText && c.ctaLink && (
              <div className="mt-8">
                <a
                  href={c.ctaLink}
                  className="inline-flex items-center px-5 py-2.5 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary hover:text-white transition-colors sm:px-7 sm:py-3.5 sm:text-sm"
                >
                  {c.ctaText}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
