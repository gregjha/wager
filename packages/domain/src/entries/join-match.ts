import "server-only";

import type { JoinMatchResponse } from "@wager/shared";
import { prisma } from "@wager/db";
import {
  CHECKOUT_HOLD_MINUTES,
  createEntryCheckoutSession,
  getAppOrigin,
  getStripe,
} from "@wager/payments";

import {
  ConflictError,
  MatchFullError,
  NotFoundError,
  PayoutsNotReadyError,
  UnauthorizedError,
} from "../auth/errors";
import { countTakenSeats, lockMatchRow } from "../matches/seats";

/** Mobile deep links go through the web bounce route so Stripe gets an https URL. */
const MOBILE_SCHEME = "wager://";

function resolveReturnUrls(matchId: string, returnUrl?: string) {
  const origin = getAppOrigin();
  const webMatchUrl = `${origin}/match/${matchId}`;

  if (returnUrl?.startsWith(MOBILE_SCHEME)) {
    const bounce = (result: string) =>
      `${origin}/checkout/return?${new URLSearchParams({
        to: returnUrl,
        checkout: result,
      })}`;
    return { successUrl: bounce("success"), cancelUrl: bounce("cancelled") };
  }

  const base =
    returnUrl && returnUrl.startsWith(origin) ? returnUrl : webMatchUrl;
  const withParam = (result: string) => {
    const url = new URL(base);
    url.searchParams.set("checkout", result);
    return url.toString();
  };
  return { successUrl: withParam("success"), cancelUrl: withParam("cancelled") };
}

type Reservation =
  | { kind: "confirmed" }
  | { kind: "resume"; checkoutId: string }
  | {
      kind: "pay";
      entryId: string;
      holdExpiresAt: Date;
      match: {
        title: string;
        entryFeeCents: number;
        currency: string;
        hostAccountId: string;
      };
    };

/**
 * Reserves a seat for the user.
 *
 * Free matches confirm immediately. Paid matches place a time-boxed hold
 * and return a Stripe Checkout URL; the webhook confirms the seat.
 *
 * @throws `MatchFullError` when no seats remain.
 * @throws `ConflictError` when the match isn't joinable or the user is already in.
 */
export async function joinMatch(
  userId: string,
  matchId: string,
  { returnUrl }: { returnUrl?: string } = {},
): Promise<JoinMatchResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user) throw new UnauthorizedError();

  const now = new Date();

  const reservation = await prisma.$transaction(
    async (tx): Promise<Reservation> => {
      await lockMatchRow(tx, matchId);

      const match = await tx.match.findUnique({
        where: { id: matchId },
        select: {
          hostId: true,
          title: true,
          status: true,
          startsAt: true,
          capacity: true,
          entryFeeCents: true,
          currency: true,
          host: {
            select: { stripeAccountId: true, stripePayoutsReady: true },
          },
        },
      });

      if (!match) throw new NotFoundError("Match not found");
      if (match.status !== "Open") {
        throw new ConflictError("This match isn't taking players");
      }
      if (match.startsAt <= now) {
        throw new ConflictError("This match has already started");
      }
      if (match.hostId === userId) {
        throw new ConflictError("You're hosting this match");
      }

      const existing = await tx.matchEntry.findUnique({
        where: { matchId_userId: { matchId, userId } },
        select: { status: true, holdExpiresAt: true, stripeCheckoutId: true },
      });

      if (existing?.status === "Confirmed") {
        throw new ConflictError("You're already in this match");
      }
      if (
        existing?.status === "Pending" &&
        existing.holdExpiresAt &&
        existing.holdExpiresAt > now &&
        existing.stripeCheckoutId
      ) {
        return { kind: "resume", checkoutId: existing.stripeCheckoutId };
      }

      const taken = await countTakenSeats(tx, matchId, {
        excludeUserId: userId,
        now,
      });
      if (taken >= match.capacity) throw new MatchFullError();

      if (match.entryFeeCents === 0) {
        await tx.matchEntry.upsert({
          where: { matchId_userId: { matchId, userId } },
          create: { matchId, userId, status: "Confirmed" },
          update: {
            status: "Confirmed",
            amountCents: 0,
            holdExpiresAt: null,
            stripeCheckoutId: null,
            stripePaymentIntentId: null,
            stripeRefundId: null,
          },
        });
        return { kind: "confirmed" };
      }

      const { stripeAccountId, stripePayoutsReady } = match.host;
      if (!stripeAccountId || !stripePayoutsReady) {
        throw new PayoutsNotReadyError(
          "The host can't accept payments right now",
        );
      }

      const holdExpiresAt = new Date(
        now.getTime() + CHECKOUT_HOLD_MINUTES * 60_000 + 60_000,
      );
      const entry = await tx.matchEntry.upsert({
        where: { matchId_userId: { matchId, userId } },
        create: {
          matchId,
          userId,
          status: "Pending",
          amountCents: match.entryFeeCents,
          holdExpiresAt,
        },
        update: {
          status: "Pending",
          amountCents: match.entryFeeCents,
          holdExpiresAt,
          stripeCheckoutId: null,
          stripePaymentIntentId: null,
          stripeRefundId: null,
        },
        select: { id: true },
      });

      return {
        kind: "pay",
        entryId: entry.id,
        holdExpiresAt,
        match: {
          title: match.title,
          entryFeeCents: match.entryFeeCents,
          currency: match.currency,
          hostAccountId: stripeAccountId,
        },
      };
    },
  );

  if (reservation.kind === "confirmed") {
    return { kind: "confirmed" };
  }

  if (reservation.kind === "resume") {
    const session = await getStripe().checkout.sessions.retrieve(
      reservation.checkoutId,
    );
    if (session.status === "open" && session.url) {
      return { kind: "checkout", url: session.url };
    }
    throw new ConflictError(
      "Your payment is still processing — refresh in a moment",
    );
  }

  // Network call happens outside the transaction so the row lock is short.
  const { successUrl, cancelUrl } = resolveReturnUrls(matchId, returnUrl);
  try {
    const session = await createEntryCheckoutSession({
      entryId: reservation.entryId,
      matchId,
      userId,
      matchTitle: reservation.match.title,
      amountCents: reservation.match.entryFeeCents,
      currency: reservation.match.currency,
      hostAccountId: reservation.match.hostAccountId,
      customerEmail: user.email,
      successUrl,
      cancelUrl,
      // Stripe's session expiry sits inside our hold window.
      expiresAt: new Date(reservation.holdExpiresAt.getTime() - 60_000),
    });

    await prisma.matchEntry.update({
      where: { id: reservation.entryId },
      data: { stripeCheckoutId: session.id },
    });

    return { kind: "checkout", url: session.url };
  } catch (error) {
    // Release the hold so the seat isn't stuck behind a failed Stripe call.
    await prisma.matchEntry.update({
      where: { id: reservation.entryId },
      data: { status: "Expired", holdExpiresAt: null },
    });
    throw error;
  }
}
