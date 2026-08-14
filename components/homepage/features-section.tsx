export interface FeatureColumn {
  icon?: string;
  title?: string;
  description?: string;
}

export interface FeaturesContent {
  columns?: FeatureColumn[];
}

interface Props {
  title?: string | null;
  subtitle?: string | null;
  content: FeaturesContent | null;
}

export function FeaturesSection({ title, subtitle, content }: Props) {
  const columns = content?.columns ?? [];

  if (!columns.length) return null;

  const iconMap: Record<string, React.ReactNode> = {
    truck: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    shield: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l7 4v5c0 5-3.5 9.7-7 11-3.5-1.3-7-6-7-11V6l7-4z" />
      </svg>
    ),
    refresh: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.5 9a9 9 0 0114.1-3.6L23 10M1 14l5.4 4.6A9 9 0 0020.5 15" />
      </svg>
    ),
    heart: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 000-7.8z" />
      </svg>
    ),
    tag: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.6 13.4l-7-7A2 2 0 0012 6H4a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 001.4-.6l7-7a2 2 0 000-2.8z" /><circle cx="7" cy="10" r="1.5" fill="currentColor" />
      </svg>
    ),
    star: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15 9 22 9 16.5 13.5 18.5 21 12 17 5.5 21 7.5 13.5 2 9 9 9 12 2" />
      </svg>
    ),
    box: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 00-1-1.7l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.7l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><polyline points="3.3 7 12 12 20.7 7" /><line x1="12" y1="22" x2="12" y2="12" />
      </svg>
    ),
    message: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  };

  return (
    <section className="py-16 sm:py-20 bg-accent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">{title}</h2>
            {subtitle && <p className="text-sm text-muted mt-2 max-w-lg mx-auto">{subtitle}</p>}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {columns.map((col, i) => (
            <div key={i} className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/5 text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                {col.icon && iconMap[col.icon] ? iconMap[col.icon] : iconMap.box}
              </div>
              {col.title && (
                <h3 className="text-sm font-semibold text-primary mb-2">{col.title}</h3>
              )}
              {col.description && (
                <p className="text-xs text-muted leading-relaxed">{col.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
