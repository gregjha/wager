import Link from "next/link";
import { MapPin } from "lucide-react";
import {
  formatSkillLevel,
  formatSportLabel,
  type MatchDTO,
} from "@bi/shared";

import { Badge } from "@/components/ui/badge";

import { DateStub } from "../date-stub";
import { EntryStatusBadge } from "../entry-status-badge";
import { PriceTag } from "../price-tag";
import { RosterMeter } from "../roster-meter";

interface MatchCardProps {
  match: MatchDTO;
}

export function MatchCard({ match }: MatchCardProps) {
  return (
    <Link
      href={`/match/${match.id}`}
      className="group flex overflow-hidden rounded-lg border bg-card transition-colors hover:border-court focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <DateStub
        startsAt={match.startsAt}
        durationMinutes={match.durationMinutes}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 pl-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-court">
              {formatSportLabel(match.sport)}
            </p>
            <h3 className="truncate text-2xl font-bold group-hover:underline decoration-line decoration-4 underline-offset-4">
              {match.title}
            </h3>
          </div>
          <PriceTag
            cents={match.entryFeeCents}
            currency={match.currency}
            className="text-3xl"
          />
        </div>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-4 shrink-0" aria-hidden />
          <span className="truncate">
            {match.venueName}, {match.city}
          </span>
        </p>
        <div className="mt-auto flex items-end justify-between gap-3">
          <RosterMeter taken={match.spotsTaken} capacity={match.capacity} />
          <div className="flex flex-wrap justify-end gap-1.5">
            <Badge variant="outline">{formatSkillLevel(match.skillLevel)}</Badge>
            <EntryStatusBadge
              entryStatus={match.viewerEntryStatus}
              matchStatus={match.status}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
