import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getMatchById } from "@wager/domain";
import { formatSkillLevel, formatSportLabel } from "@wager/shared";

import { auth } from "@/auth";
import { DateStub } from "@/components/match/date-stub";
import { EntryStatusBadge } from "@/components/match/entry-status-badge";
import { HostControls } from "@/components/match/host-controls";
import { JoinPanel } from "@/components/match/join-panel";
import { RosterList } from "@/components/match/roster-list";
import { MatchDetailFallback } from "@/components/suspense-fallbacks/match-detail-fallback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDuration, formatMatchStart } from "@/lib/format/match-time";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ checkout?: string }>;
};

export default function MatchPage(props: PageProps) {
  return (
    <Suspense fallback={<MatchDetailFallback />}>
      <MatchPageContent {...props} />
    </Suspense>
  );
}

async function MatchPageContent({ params, searchParams }: PageProps) {
  const [{ id }, { checkout }] = await Promise.all([params, searchParams]);
  const session = await auth();
  const match = await getMatchById(id, session?.user?.id);

  if (!match) {
    notFound();
  }

  const isHost = session?.user?.id === match.host.id;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${match.venueName}, ${match.address}, ${match.city}`,
  )}`;

  return (
    <main className="mx-auto px-4 py-8 max-w-6xl">
      <Button variant="ghost" className="mb-4 -ml-3" asChild={true}>
        <Link href="/">
          <ArrowLeft className="size-4" />
          All matches
        </Link>
      </Button>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_24rem]">
        <div className="min-w-0 space-y-8">
          <div className="flex overflow-hidden rounded-lg border bg-card">
            <DateStub
              startsAt={match.startsAt}
              durationMinutes={match.durationMinutes}
              className="w-28"
            />
            <div className="flex-1 space-y-3 p-5 pl-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-court">
                  {formatSportLabel(match.sport)}
                </span>
                <Badge variant="outline">
                  {formatSkillLevel(match.skillLevel)}
                </Badge>
                <EntryStatusBadge
                  entryStatus={match.viewerEntryStatus}
                  matchStatus={match.status}
                />
              </div>
              <h1 className="text-5xl font-bold leading-none">{match.title}</h1>
              <p className="text-lg">
                {formatMatchStart(match.startsAt)}, for{" "}
                {formatDuration(match.durationMinutes)}
              </p>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-start gap-1 text-muted-foreground hover:text-court"
              >
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  <span className="font-medium text-asphalt">
                    {match.venueName}
                  </span>
                  <br />
                  {match.address}, {match.city}
                </span>
              </a>
            </div>
          </div>

          {isHost ? <HostControls match={match} /> : null}

          {match.description ? (
            <section>
              <h2 className="mb-2 text-3xl font-bold">From the host</h2>
              <p className="max-w-prose whitespace-pre-line leading-relaxed">
                {match.description}
              </p>
            </section>
          ) : null}

          <section>
            <h2 className="mb-3 text-3xl font-bold">Roster</h2>
            <RosterList
              host={match.host}
              roster={match.roster}
              capacity={match.capacity}
            />
          </section>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <JoinPanel match={match} checkoutResult={checkout} />
        </aside>
      </div>
    </main>
  );
}
