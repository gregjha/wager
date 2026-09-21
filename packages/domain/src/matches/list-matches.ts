import "server-only";

import type { MatchConnection, MatchesListQuery } from "@wager/shared";
import { prisma, type Prisma } from "@wager/db";

import { decodeMatchCursor, encodeMatchCursor } from "./cursor";
import {
  mapMatchToDto,
  matchSelectWithViewer,
  type MatchRecord,
} from "./match-select";
import { seatHoldingEntryWhere } from "./seats";

type Filters = Pick<MatchesListQuery, "search" | "sport" | "city" | "price">;

function matchFilterWhere(filters: Filters): Prisma.MatchWhereInput[] {
  const where: Prisma.MatchWhereInput[] = [];
  if (filters.search) {
    where.push({
      OR: [
        { title: { contains: filters.search, mode: "insensitive" } },
        { venueName: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ],
    });
  }
  if (filters.sport) where.push({ sport: filters.sport });
  if (filters.city) {
    where.push({ city: { equals: filters.city.trim(), mode: "insensitive" } });
  }
  if (filters.price === "free") where.push({ entryFeeCents: 0 });
  if (filters.price === "paid") where.push({ entryFeeCents: { gt: 0 } });
  return where;
}

function buildMatchConnection(
  matches: MatchRecord[],
  take: number,
  after: string | null | undefined,
  now: Date,
): MatchConnection {
  const hasNextPage = matches.length > take;
  const sliced = hasNextPage ? matches.slice(0, take) : matches;
  const cursorFor = (m: MatchRecord) =>
    encodeMatchCursor({ startsAt: m.startsAt.toISOString(), id: m.id });

  return {
    exists: after ? true : sliced.length > 0,
    pageInfo: {
      hasPreviousPage: Boolean(after),
      hasNextPage,
      startCursor: sliced[0] ? cursorFor(sliced[0]) : null,
      endCursor: sliced.at(-1) ? cursorFor(sliced.at(-1)!) : null,
    },
    edges: sliced.map((match) => ({
      cursor: cursorFor(match),
      node: mapMatchToDto(match, now),
    })),
  };
}

/** Keyset page ordered by soonest start first. */
async function fetchMatchPage(
  where: Prisma.MatchWhereInput[],
  {
    first,
    after,
    viewerUserId,
    now,
  }: {
    first: number;
    after?: string | null;
    viewerUserId?: string | null;
    now: Date;
  },
): Promise<MatchRecord[]> {
  const afterCursor = after ? decodeMatchCursor(after) : null;
  const and = [...where];

  if (afterCursor) {
    const startsAt = new Date(afterCursor.startsAt);
    and.push({
      OR: [
        { startsAt: { gt: startsAt } },
        { AND: [{ startsAt: { equals: startsAt } }, { id: { gt: afterCursor.id } }] },
      ],
    });
  }

  return prisma.match.findMany({
    take: first + 1,
    where: and.length ? { AND: and } : undefined,
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    select: matchSelectWithViewer(viewerUserId, now),
  });
}

/** Public feed: open matches that haven't started yet. */
export async function listMatches({
  first = 24,
  after,
  viewerUserId,
  ...filters
}: Partial<MatchesListQuery> & {
  viewerUserId?: string | null;
}): Promise<MatchConnection> {
  const now = new Date();
  const matches = await fetchMatchPage(
    [{ status: "Open", startsAt: { gt: now } }, ...matchFilterWhere(filters)],
    { first, after, viewerUserId, now },
  );
  return buildMatchConnection(matches, first, after, now);
}

export async function listHostingMatches(
  userId: string,
  { first = 24, after }: { first?: number; after?: string | null },
): Promise<MatchConnection> {
  const now = new Date();
  const matches = await fetchMatchPage([{ hostId: userId }], {
    first,
    after,
    viewerUserId: userId,
    now,
  });
  return buildMatchConnection(matches, first, after, now);
}

export async function listJoinedMatches(
  userId: string,
  { first = 24, after }: { first?: number; after?: string | null },
): Promise<MatchConnection> {
  const now = new Date();
  const matches = await fetchMatchPage(
    [{ entries: { some: { userId, ...seatHoldingEntryWhere(now) } } }],
    { first, after, viewerUserId: userId, now },
  );
  return buildMatchConnection(matches, first, after, now);
}
