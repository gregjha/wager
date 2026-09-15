"use client";

import Link from "next/link";

import { MatchListShell } from "@/components/match/list/match-list-shell";
import { Button } from "@/components/ui/button";
import { useJoinedMatches } from "@/lib/query/hooks/use-matches";

export default function ProfileJoined() {
  const query = useJoinedMatches();

  return (
    <>
      <h2 className="text-3xl font-bold">Matches you&apos;re in</h2>
      <MatchListShell
        {...query}
        emptyState={
          <div className="rounded-lg border border-dashed bg-card px-6 py-12 text-center">
            <p className="mb-4 text-muted-foreground">
              You&apos;re not on any rosters yet.
            </p>
            <Button asChild={true}>
              <Link href="/">Find a match</Link>
            </Button>
          </div>
        }
      />
    </>
  );
}
