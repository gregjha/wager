import { Skeleton } from "@/components/ui/skeleton";

export function ProfileFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="space-y-8">
        <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0">
          <Skeleton className="size-24 rounded-full" />
          <div className="space-y-2 text-center sm:text-left">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-56" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid w-full grid-cols-2 gap-2 rounded-md border p-1">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>

          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>

          <Skeleton className="h-52 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
