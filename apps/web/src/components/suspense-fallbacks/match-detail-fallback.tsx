import { Skeleton } from "@/components/ui/skeleton";

export function MatchDetailFallback() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Skeleton className="mb-4 h-9 w-32" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-8">
          <div className="flex overflow-hidden rounded-lg border bg-card">
            <Skeleton className="h-44 w-28 rounded-none" />
            <div className="flex-1 space-y-3 p-5 pl-7">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-11 w-3/4" />
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-10 w-56" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-full max-w-prose" />
            <Skeleton className="h-4 w-5/6 max-w-prose" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </main>
  );
}
