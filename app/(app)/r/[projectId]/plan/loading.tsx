import { Skeleton } from "@/components/Skeleton";

export default function PlanLoading() {
  return (
    <div className="px-5 py-5">
      <Skeleton className="h-32 w-full rounded-2xl mb-4" />
      <div className="text-center mb-4">
        <Skeleton className="h-6 w-40 mx-auto mb-1" />
        <Skeleton className="h-3 w-32 mx-auto" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-5 w-24 mb-2" />
            <Skeleton className="h-12 w-full mb-1.5" />
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
