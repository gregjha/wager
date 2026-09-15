"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { MatchListShell } from "@/components/match/list/match-list-shell";
import { Button } from "@/components/ui/button";
import { useHostingMatches } from "@/lib/query/hooks/use-matches";

export default function ProfileHosting() {
  const query = useHostingMatches();

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Matches you host</h2>
        <Button asChild={true}>
          <Link href="/match/new">
            <Plus className="size-4" />
            Host a match
          </Link>
        </Button>
      </div>
      <MatchListShell
        {...query}
        emptyState={
          <div className="rounded-lg border border-dashed bg-card px-6 py-12 text-center">
            <p className="mb-4 text-muted-foreground">
              You haven&apos;t hosted a match yet. Pick a court and a time,
              and players can start joining.
            </p>
            <Button asChild={true}>
              <Link href="/match/new">Host your first match</Link>
            </Button>
          </div>
        }
      />
    </>
  );
}
