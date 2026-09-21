import "server-only";

import type { CreateMatchInput, UpdateMatchInput } from "@wager/shared";
import { prisma } from "@wager/db";
import { expireCheckoutSession, refundEntryPayment } from "@wager/payments";

import {
  ConflictError,
  ForbiddenError,
  PayoutsNotReadyError,
} from "../auth/errors";
import { countTakenSeats, lockMatchRow } from "./seats";

async function assertHostCanCharge(userId: string, entryFeeCents: number) {
  if (entryFeeCents === 0) return;
  const host = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeAccountId: true, stripePayoutsReady: true },
  });
  if (!host?.stripeAccountId || !host.stripePayoutsReady) {
    throw new PayoutsNotReadyError();
  }
}

async function getHostedMatchOrThrow(matchId: string, userId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId, hostId: userId },
    select: { id: true, status: true, entryFeeCents: true, startsAt: true },
  });
  if (!match) {
    throw new ForbiddenError("Not authorized to make changes to this match");
  }
  return match;
}

export async function createMatchForUser(
  userId: string,
  input: CreateMatchInput,
): Promise<{ id: string }> {
  await assertHostCanCharge(userId, input.entryFeeCents);

  const match = await prisma.match.create({
    data: {
      ...input,
      host: { connect: { id: userId } },
    },
    select: { id: true },
  });

  return { id: match.id };
}

/**
 * Updates a match the user hosts.
 *
 * Price is locked once anyone has paid, and capacity can't drop below the
 * seats already taken — both would strand existing players.
 */
export async function updateMatchForUser(
  userId: string,
  input: UpdateMatchInput,
): Promise<{ id: string }> {
  const existing = await getHostedMatchOrThrow(input.id, userId);
  if (existing.status !== "Open") {
    throw new ConflictError("Only open matches can be edited");
  }

  const { id, ...data } = input;

  if (
    data.entryFeeCents !== undefined &&
    data.entryFeeCents !== existing.entryFeeCents
  ) {
    await assertHostCanCharge(userId, data.entryFeeCents);
  }

  await prisma.$transaction(async (tx) => {
    await lockMatchRow(tx, id);
    const taken = await countTakenSeats(tx, id);

    if (data.capacity !== undefined && data.capacity < taken) {
      throw new ConflictError(
        `${taken} players have already joined — capacity can't go below that`,
      );
    }
    if (
      data.entryFeeCents !== undefined &&
      data.entryFeeCents !== existing.entryFeeCents &&
      taken > 0
    ) {
      throw new ConflictError(
        "The entry fee can't change after players have joined",
      );
    }

    await tx.match.update({ where: { id }, data });
  });

  return { id };
}

/**
 * Cancels a hosted match and refunds every paid player in full.
 *
 * Refunds run one at a time so a Stripe failure leaves the remaining
 * entries untouched; calling this again resumes where it stopped.
 */
export async function cancelMatchForUser(
  userId: string,
  matchId: string,
): Promise<{ refundedCount: number }> {
  const match = await getHostedMatchOrThrow(matchId, userId);
  if (match.status === "Completed") {
    throw new ConflictError("Completed matches can't be cancelled");
  }

  await prisma.match.update({
    where: { id: matchId },
    data: { status: "Cancelled" },
  });

  const entries = await prisma.matchEntry.findMany({
    where: { matchId, status: { in: ["Confirmed", "Pending"] } },
    select: {
      id: true,
      status: true,
      stripePaymentIntentId: true,
      stripeCheckoutId: true,
    },
  });

  let refundedCount = 0;
  for (const entry of entries) {
    if (entry.status === "Pending") {
      if (entry.stripeCheckoutId) {
        await expireCheckoutSession(entry.stripeCheckoutId);
      }
      await prisma.matchEntry.update({
        where: { id: entry.id },
        data: { status: "Expired", holdExpiresAt: null },
      });
      continue;
    }

    if (entry.stripePaymentIntentId) {
      const refundId = await refundEntryPayment(
        entry.stripePaymentIntentId,
        entry.id,
      );
      await prisma.matchEntry.update({
        where: { id: entry.id },
        data: { status: "Refunded", stripeRefundId: refundId },
      });
      refundedCount += 1;
    } else {
      await prisma.matchEntry.update({
        where: { id: entry.id },
        data: { status: "Left" },
      });
    }
  }

  return { refundedCount };
}
