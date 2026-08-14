export interface StatItem {
  value?: string;
  label?: string;
}

export interface StatsContent {
  items?: StatItem[];
  columns?: number;
}

interface Props {
  title?: string | null;
  subtitle?: string | null;
  content: StatsContent | null;
}

export function StatsSection({ title, subtitle, content }: Props) {
  const items = content?.items ?? [];

  if (!items.length) return null;

  const cols = Math.min(content?.columns ?? items.length, 4);
  const gridClasses: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <section className="py-16 sm:py-20 bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
            {subtitle && <p className="text-sm text-white/60 mt-2">{subtitle}</p>}
          </div>
        )}

        <div className={`grid ${gridClasses[cols] ?? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"} gap-8`}>
          {items.map((item, i) => (
            <div key={i} className="text-center">
              {item.value && (
                <p className="text-3xl sm:text-4xl font-bold tracking-tight">{item.value}</p>
              )}
              {item.label && (
                <p className="text-xs text-white/60 mt-1 uppercase tracking-wider">{item.label}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
