import { Skeleton } from "@/components/ui/skeleton";

export function MatchFormFallback({ heading }: { heading: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-5xl font-bold">{heading}</h1>
      <div className="space-y-6 rounded-xl border bg-card p-6">
        {Array.from({ length: 3 }, (_, section) => (
          <div key={section} className="space-y-4">
            <Skeleton className="h-7 w-40" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
