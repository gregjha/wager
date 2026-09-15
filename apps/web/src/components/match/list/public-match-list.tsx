"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { sportSchema } from "@bi/shared";

import { Button } from "@/components/ui/button";
import { useMatches } from "@/lib/query/hooks/use-matches";

import { MatchListShell } from "./match-list-shell";

export default function PublicMatchList() {
  const searchParams = useSearchParams();
  const sport = sportSchema.safeParse(searchParams.get("sport"));
  const price = searchParams.get("price");

  const query = useMatches({
    search: searchParams.get("search") || undefined,
    city: searchParams.get("city") || undefined,
    sport: sport.success ? sport.data : undefined,
    price: price === "free" || price === "paid" ? price : undefined,
  });

  const filtered = searchParams.size > 0;

  return (
    <MatchListShell
      {...query}
      emptyState={
        <div className="rounded-lg border border-dashed bg-card px-6 py-12 text-center">
          <p className="font-display text-2xl font-bold">
            {filtered ? "No matches fit those filters" : "No upcoming matches yet"}
          </p>
          <p className="mt-1 text-muted-foreground">
            {filtered
              ? "Try another sport or clear the filters."
              : "Put one on the calendar and players will find it."}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            {filtered ? (
              <Button variant="outline" asChild={true}>
                <Link href="/">Clear filters</Link>
              </Button>
            ) : null}
            <Button asChild={true}>
              <Link href="/match/new">Host a match</Link>
            </Button>
          </div>
        </div>
      }
    />
  );
}
