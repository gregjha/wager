import Link from "next/link";
import { Suspense } from "react";

import { MatchFilters } from "@/components/match/list/match-filters";
import MatchSkeletonList from "@/components/match/list/match-skeleton-list";
import PublicMatchList from "@/components/match/list/public-match-list";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-6xl font-bold leading-[0.95] sm:text-7xl">
            Next up
          </h1>
          <p className="mt-2 max-w-prose text-lg text-muted-foreground">
            Pickup games with open spots. Pay your share, lock your place on
            the roster.
          </p>
        </div>
        <Button asChild={true} size="lg" variant="outline">
          <Link href="/match/new">Host a match</Link>
        </Button>
      </div>
      <Suspense fallback={<div className="mb-8 h-9 rounded-md border bg-card" />}>
        <MatchFilters className="mb-8" />
      </Suspense>
      <Suspense fallback={<MatchSkeletonList />}>
        <PublicMatchList />
      </Suspense>
    </main>
  );
}
