import "server-only";

import type { MatchDetailDTO } from "@wager/shared";
import { prisma } from "@wager/db";

import { mapMatchDetailToDto, matchSelectWithViewer } from "./match-select";

export async function getMatchById(
  id: string,
  viewerUserId?: string | null,
): Promise<MatchDetailDTO | null> {
  const now = new Date();
  const [match, roster] = await Promise.all([
    prisma.match.findUnique({
      where: { id },
      select: matchSelectWithViewer(viewerUserId, now),
    }),
    prisma.matchEntry.findMany({
      where: { matchId: id, status: "Confirmed" },
      orderBy: { updatedAt: "asc" },
      select: { user: { select: { id: true, name: true, image: true } } },
    }),
  ]);

  if (!match) {
    return null;
  }

  return mapMatchDetailToDto(match, roster, now);
}
