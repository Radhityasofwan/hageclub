export interface TestimonialItem {
  name?: string;
  role?: string;
  avatar?: string;
  quote?: string;
}

export interface TestimonialsContent {
  items?: TestimonialItem[];
}

interface Props {
  title?: string | null;
  subtitle?: string | null;
  content: TestimonialsContent | null;
}

export function TestimonialsSection({ title, subtitle, content }: Props) {
  const items = content?.items ?? [];

  if (!items.length) return null;

  return (
    <section className="py-16 sm:py-20 bg-accent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">{title}</h2>
            {subtitle && <p className="text-sm text-muted mt-2">{subtitle}</p>}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <div key={i} className="bg-white border border-border rounded p-6">
              {/* Quote */}
              <svg className="w-6 h-6 text-primary/20 mb-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.5 6.5C17 8 18.5 10.5 18.5 13c0 1.5-.5 3-1.5 4.5l-2 .5c1-2 1.5-3.5 1.5-5 0-1-.3-2-1-3l-1-1c.5.5 1 1 1.5 1.5v-1.5c0-1 0-2-.5-3l-1-1.5h1.5zM7.5 6.5C10 8 11.5 10.5 11.5 13c0 1.5-.5 3-1.5 4.5l-2 .5c1-2 1.5-3.5 1.5-5 0-1-.3-2-1-3l-1-1c.5.5 1 1 1.5 1.5v-1.5c0-1 0-2-.5-3l-1-1.5h1.5z" />
              </svg>
              {item.quote && (
                <p className="text-sm text-muted leading-relaxed mb-6">&ldquo;{item.quote}&rdquo;</p>
              )}
              <div className="flex items-center gap-3">
                {item.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.avatar} alt={item.name ?? ""} width={36} height={36} loading="lazy" decoding="async" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                    {item.name?.charAt(0) ?? "?"}
                  </div>
                )}
                <div>
                  {item.name && <p className="text-xs font-semibold text-primary">{item.name}</p>}
                  {item.role && <p className="text-[10px] text-muted">{item.role}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
