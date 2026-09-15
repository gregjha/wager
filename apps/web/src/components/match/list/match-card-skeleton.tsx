import { Skeleton } from "@/components/ui/skeleton";

export default function MatchCardSkeleton() {
  return (
    <div className="flex overflow-hidden rounded-lg border bg-card">
      <Skeleton className="w-24 shrink-0 rounded-none" />
      <div className="flex flex-1 flex-col gap-3 p-4 pl-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-44" />
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  );
}
