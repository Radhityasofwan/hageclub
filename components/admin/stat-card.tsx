import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    direction: "up" | "down";
    label: string;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-white border border-border rounded-lg p-5 flex flex-col gap-3",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider leading-none">
          {title}
        </p>
        {icon && (
          <div className="w-8 h-8 bg-accent rounded flex items-center justify-center text-muted shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div>
        <p className="text-2xl font-bold text-primary tracking-tight leading-none">
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-muted mt-1.5 leading-tight">{subtitle}</p>
        )}
      </div>

      {trend && (
        <p
          className={cn(
            "text-xs font-medium flex items-center gap-1",
            trend.direction === "up" ? "text-success" : "text-destructive"
          )}
        >
          <span>{trend.direction === "up" ? "↑" : "↓"}</span>
          <span>{trend.label}</span>
        </p>
      )}
    </div>
  );
}
