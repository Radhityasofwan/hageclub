import { cn } from "@/lib/utils";

export interface SkeletonProps {
  variant?: "text" | "block" | "circle";
  width?: string;
  height?: string;
  className?: string;
}

export function Skeleton({
  variant = "block",
  width,
  height,
  className,
}: SkeletonProps) {
  return (
    <span
      className={cn(
        "block animate-pulse bg-accent dark:bg-white/10",
        variant === "circle" && "rounded-full",
        variant === "text" && "rounded h-4",
        variant === "block" && "rounded",
        className
      )}
      style={{
        width: width ?? (variant === "circle" ? height : "100%"),
        height:
          height ??
          (variant === "text" ? "1rem" : variant === "circle" ? width : "1rem"),
      }}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? "60%" : "100%"}
        />
      ))}
    </div>
  );
}
