import { Skeleton, SkeletonCard } from "@/components/Skeleton";

export default function ProjectLoading() {
  return (
    <>
      {/* 家族チップ */}
      <div className="flex flex-wrap gap-1.5 px-4 pt-3 pb-1">
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
      <div className="flex gap-2 overflow-x-auto px-4 py-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-16 rounded-full flex-shrink-0" />
        ))}
      </div>
      <div className="px-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </>
  );
}
