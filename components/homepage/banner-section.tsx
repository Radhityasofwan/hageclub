export interface BannerContent {
  bgImage?: string;
  bgColor?: string;
  text?: string;
  ctaText?: string;
  ctaLink?: string;
  textDark?: boolean;
}

interface Props {
  title?: string | null;
  subtitle?: string | null;
  content: BannerContent | null;
}

export function BannerSection({ title, subtitle, content }: Props) {
  const c = content ?? {};
  const textLight = !c.textDark;

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background */}
      {c.bgImage ? (
        <>
          <img src={c.bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50" />
        </>
      ) : (
        <div className={`absolute inset-0 ${c.bgColor || "bg-primary"}`} />
      )}

      <div className={`relative z-10 max-w-3xl mx-auto px-4 text-center ${textLight ? "text-white" : "text-primary"}`}>
        {title && (
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
        )}
        {subtitle && (
          <p className={`mt-3 text-sm ${textLight ? "text-white/70" : "text-muted"}`}>{subtitle}</p>
        )}
        {c.text && (
          <p className={`mt-4 text-base leading-relaxed ${textLight ? "text-white/60" : "text-muted"}`}>
            {c.text}
          </p>
        )}
        {c.ctaText && c.ctaLink && (
          <div className="mt-8">
            <a
              href={c.ctaLink}
              className={`inline-flex items-center justify-center px-5 py-2.5 text-xs font-semibold rounded-lg transition-colors sm:px-7 sm:py-3.5 sm:text-sm ${
                textLight
                  ? "bg-white text-primary hover:bg-white/90"
                  : "bg-primary text-white hover:bg-primary/90"
              }`}
            >
              {c.ctaText}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
