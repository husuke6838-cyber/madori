import { Skeleton, SkeletonCard } from "@/components/Skeleton";

export default function NoteLoading() {
  return (
    <>
      {/* 家族チップ */}
      <div className="flex flex-wrap gap-1.5 px-4 pt-3 pb-1">
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-16 rounded-full" />
      </div>
      {/* 部屋タブ */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-16 rounded-full flex-shrink-0" />
        ))}
      </div>
      {/* 部屋見出し */}
      <div className="px-4 pt-1 pb-2">
        <Skeleton className="h-7 w-32" />
      </div>
      <div className="px-4">
        <Skeleton className="h-4 w-2/3 mb-4" />
      </div>
      {/* 要望カード */}
      <div className="px-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </>
  );
}
