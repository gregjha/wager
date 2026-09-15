import "server-only";

import type { Prisma } from "@bi/db";

/**
 * Entries that occupy a seat right now: confirmed players plus checkout
 * holds that haven't lapsed. Everything that counts capacity uses this.
 */
export function seatHoldingEntryWhere(
  now: Date = new Date(),
): Prisma.MatchEntryWhereInput {
  return {
    OR: [
      { status: "Confirmed" },
      { status: "Pending", holdExpiresAt: { gt: now } },
    ],
  };
}

export async function countTakenSeats(
  client: Prisma.TransactionClient,
  matchId: string,
  options: { excludeUserId?: string; now?: Date } = {},
): Promise<number> {
  return client.matchEntry.count({
    where: {
      matchId,
      ...(options.excludeUserId
        ? { userId: { not: options.excludeUserId } }
        : null),
      ...seatHoldingEntryWhere(options.now),
    },
  });
}

/** Row lock so concurrent joins for the same match serialize on capacity. */
export async function lockMatchRow(
  client: Prisma.TransactionClient,
  matchId: string,
): Promise<void> {
  await client.$queryRaw`SELECT id FROM "Match" WHERE id = ${matchId} FOR UPDATE`;
}
