import { Skeleton } from "@/components/Skeleton";

export default function FloorplanLoading() {
  return (
    <div>
      <div className="px-4 pt-3 flex items-center gap-2">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-16 ml-auto" />
      </div>
      <div className="flex gap-1.5 px-4 py-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-14 rounded-full" />
        ))}
      </div>
      <Skeleton className="mx-4 h-24 rounded-2xl" />
      <div className="mt-3 flex">
        <Skeleton className="flex-1 h-[60vh] min-h-[320px] rounded-none" />
        <Skeleton className="w-[78px] h-[60vh] min-h-[320px] rounded-none" />
      </div>
    </div>
  );
}
