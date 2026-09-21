import "server-only";

import type {
  EntryStatusLabel,
  MatchDetailDTO,
  MatchDTO,
} from "@wager/shared";
import type { Prisma } from "@wager/db";

import { seatHoldingEntryWhere } from "./seats";

const hostSelect = {
  select: { id: true, name: true, image: true },
} as const;

function baseSelect(now: Date) {
  return {
    id: true,
    title: true,
    description: true,
    sport: true,
    skillLevel: true,
    status: true,
    startsAt: true,
    durationMinutes: true,
    venueName: true,
    address: true,
    city: true,
    capacity: true,
    entryFeeCents: true,
    currency: true,
    refundCutoffHours: true,
    host: hostSelect,
    _count: {
      select: { entries: { where: seatHoldingEntryWhere(now) } },
    },
  } satisfies Prisma.MatchSelect;
}

/**
 * Select for match reads. When `viewerUserId` is set, includes the viewer's
 * own entry (at most one row) for `viewerEntryStatus`.
 */
export function matchSelectWithViewer(
  viewerUserId?: string | null,
  now: Date = new Date(),
) {
  return {
    ...baseSelect(now),
    entries: {
      where: { userId: viewerUserId ?? "__anonymous__" },
      select: { status: true, holdExpiresAt: true },
      take: 1,
    },
  } satisfies Prisma.MatchSelect;
}


export type MatchRecord = Prisma.MatchGetPayload<{
  select: ReturnType<typeof matchSelectWithViewer>;
}>;

function resolveViewerStatus(
  entry: MatchRecord["entries"][number] | undefined,
  now: Date,
): EntryStatusLabel | null {
  if (!entry) return null;
  // A lapsed hold reads as "not joined" so the UI offers Join again.
  if (
    entry.status === "Pending" &&
    (!entry.holdExpiresAt || entry.holdExpiresAt <= now)
  ) {
    return null;
  }
  return entry.status;
}

export function mapMatchToDto(match: MatchRecord, now = new Date()): MatchDTO {
  return {
    id: match.id,
    title: match.title,
    description: match.description,
    sport: match.sport,
    skillLevel: match.skillLevel,
    status: match.status,
    startsAt: match.startsAt.toISOString(),
    durationMinutes: match.durationMinutes,
    venueName: match.venueName,
    address: match.address,
    city: match.city,
    capacity: match.capacity,
    entryFeeCents: match.entryFeeCents,
    currency: match.currency,
    refundCutoffHours: match.refundCutoffHours,
    host: match.host,
    spotsTaken: match._count.entries,
    viewerEntryStatus: resolveViewerStatus(match.entries[0], now),
  };
}

export function mapMatchDetailToDto(
  match: MatchRecord,
  roster: { user: { id: string; name: string; image: string | null } }[],
  now = new Date(),
): MatchDetailDTO {
  return {
    ...mapMatchToDto(match, now),
    roster: roster.map(({ user }) => ({
      id: user.id,
      name: user.name || null,
      image: user.image,
    })),
  };
}
