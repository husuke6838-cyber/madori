import { cn } from "@/lib/ui";

/**
 * 読み込み中のプレースホルダ。
 * Tailwind の animate-pulse とアプリの paper/line トーンで統一。
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-line/40 rounded-md animate-pulse",
        className
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-surface border border-line border-l-[3px] border-l-line/60 rounded-[var(--radius-card)] px-4 py-3.5 mb-3">
      <Skeleton className="h-4 w-3/4 mb-3" />
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}
