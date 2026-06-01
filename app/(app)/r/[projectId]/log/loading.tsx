import { Skeleton } from "@/components/Skeleton";

export default function LogLoading() {
  return (
    <div className="px-5 py-5">
      <Skeleton className="h-7 w-40 mb-1" />
      <Skeleton className="h-3 w-60 mb-6" />
      <div className="space-y-5 ml-1.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="relative pl-7 border-l-2 border-line">
            <span className="absolute -left-[7px] top-0.5 w-3 h-3 rounded-full bg-line/40" />
            <Skeleton className="h-3 w-20 mb-1.5" />
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
