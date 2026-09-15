import "server-only";

import type { LeaveMatchResponse } from "@bi/shared";
import { prisma } from "@bi/db";
import { expireCheckoutSession, refundEntryPayment } from "@bi/payments";

import { ConflictError, NotFoundError } from "../auth/errors";

export function isRefundable(
  startsAt: Date,
  refundCutoffHours: number,
  now: Date = new Date(),
): boolean {
  return now.getTime() < startsAt.getTime() - refundCutoffHours * 3_600_000;
}

/**
 * Gives up the user's seat. Paid entries are refunded in full when leaving
 * before the match's refund cutoff; after that the seat is released
 * without a refund.
 */
export async function leaveMatch(
  userId: string,
  matchId: string,
): Promise<LeaveMatchResponse> {
  const entry = await prisma.matchEntry.findUnique({
    where: { matchId_userId: { matchId, userId } },
    select: {
      id: true,
      status: true,
      stripeCheckoutId: true,
      stripePaymentIntentId: true,
      match: {
        select: { startsAt: true, refundCutoffHours: true, status: true },
      },
    },
  });

  if (!entry || !["Confirmed", "Pending"].includes(entry.status)) {
    throw new NotFoundError("You're not in this match");
  }

  if (entry.status === "Pending") {
    if (entry.stripeCheckoutId) {
      await expireCheckoutSession(entry.stripeCheckoutId);
    }
    await prisma.matchEntry.update({
      where: { id: entry.id },
      data: { status: "Expired", holdExpiresAt: null },
    });
    return { refunded: false };
  }

  const now = new Date();
  if (entry.match.startsAt <= now) {
    throw new ConflictError("This match has already started");
  }

  const canRefund =
    Boolean(entry.stripePaymentIntentId) &&
    isRefundable(entry.match.startsAt, entry.match.refundCutoffHours, now);

  if (canRefund) {
    const refundId = await refundEntryPayment(
      entry.stripePaymentIntentId!,
      entry.id,
    );
    await prisma.matchEntry.update({
      where: { id: entry.id },
      data: { status: "Refunded", stripeRefundId: refundId },
    });
    return { refunded: true };
  }

  await prisma.matchEntry.update({
    where: { id: entry.id },
    data: { status: "Left" },
  });
  return { refunded: false };
}
