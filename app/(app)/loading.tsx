import { Skeleton } from "@/components/Skeleton";

export default function MyLoading() {
  return (
    <main className="flex-1 max-w-md mx-auto w-full px-5 py-6">
      <div className="mb-5">
        <Skeleton className="h-3 w-16 mb-1" />
        <Skeleton className="h-5 w-40" />
      </div>
      <Skeleton className="h-5 w-32 mb-3" />
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-12 w-full rounded-xl mt-6" />
    </main>
  );
}
