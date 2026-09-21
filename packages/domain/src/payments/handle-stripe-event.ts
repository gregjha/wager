import "server-only";

import { prisma, Prisma } from "@wager/db";
import { refundEntryPayment, type Stripe } from "@wager/payments";

import { countTakenSeats, lockMatchRow } from "../matches/seats";

function paymentIntentId(
  value: string | Stripe.PaymentIntent | null,
): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

/**
 * Confirms a paid seat — or refunds the payment when the seat can no longer
 * be honored (hold lapsed and someone took the spot, or the match was
 * cancelled while the player was on the Checkout page).
 */
async function onCheckoutCompleted(session: Stripe.Checkout.Session) {
  const entryId = session.metadata?.entryId;
  const piId = paymentIntentId(session.payment_intent);
  if (!entryId || !piId || session.payment_status !== "paid") return;

  const outcome = await prisma.$transaction(async (tx) => {
    const entry = await tx.matchEntry.findUnique({
      where: { id: entryId },
      select: { id: true, status: true, matchId: true, userId: true },
    });
    if (!entry) return "missing" as const;
    if (entry.status === "Confirmed" || entry.status === "Refunded") {
      return "done" as const;
    }

    await lockMatchRow(tx, entry.matchId);
    const match = await tx.match.findUniqueOrThrow({
      where: { id: entry.matchId },
      select: { status: true, capacity: true, startsAt: true },
    });
    const taken = await countTakenSeats(tx, entry.matchId, {
      excludeUserId: entry.userId,
    });

    const seatAvailable =
      match.status === "Open" &&
      match.startsAt > new Date() &&
      taken < match.capacity;

    await tx.matchEntry.update({
      where: { id: entry.id },
      data: seatAvailable
        ? {
            status: "Confirmed",
            holdExpiresAt: null,
            stripeCheckoutId: session.id,
            stripePaymentIntentId: piId,
          }
        : {
            // Keep the PI so the refund below (or a retry) can find it.
            stripeCheckoutId: session.id,
            stripePaymentIntentId: piId,
          },
    });

    return seatAvailable ? ("confirmed" as const) : ("refund" as const);
  });

  if (outcome === "refund") {
    const refundId = await refundEntryPayment(piId, entryId);
    await prisma.matchEntry.update({
      where: { id: entryId },
      data: {
        status: "Refunded",
        holdExpiresAt: null,
        stripeRefundId: refundId,
      },
    });
  }
}

async function onCheckoutExpired(session: Stripe.Checkout.Session) {
  await prisma.matchEntry.updateMany({
    where: { stripeCheckoutId: session.id, status: "Pending" },
    data: { status: "Expired", holdExpiresAt: null },
  });
}

async function onAccountUpdated(account: Stripe.Account) {
  await prisma.user.updateMany({
    where: { stripeAccountId: account.id },
    data: {
      stripePayoutsReady: Boolean(
        account.charges_enabled && account.details_submitted,
      ),
    },
  });
}

/** Refunds issued from the Stripe dashboard still free the seat. */
async function onChargeRefunded(charge: Stripe.Charge) {
  const piId = paymentIntentId(charge.payment_intent);
  if (!piId || !charge.refunded) return;
  await prisma.matchEntry.updateMany({
    where: {
      stripePaymentIntentId: piId,
      status: { in: ["Confirmed", "Left"] },
    },
    data: { status: "Refunded" },
  });
}

/**
 * Applies a verified Stripe event exactly once.
 *
 * Handlers are idempotent on their own; the `StripeEvent` ledger is recorded
 * only after success, so a failed handler is retried by Stripe.
 */
export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  const seen = await prisma.stripeEvent.findUnique({
    where: { id: event.id },
    select: { id: true },
  });
  if (seen) return;

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await onCheckoutCompleted(event.data.object);
      break;
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed":
      await onCheckoutExpired(event.data.object);
      break;
    case "account.updated":
      await onAccountUpdated(event.data.object);
      break;
    case "charge.refunded":
      await onChargeRefunded(event.data.object);
      break;
    default:
      break;
  }

  try {
    await prisma.stripeEvent.create({
      data: { id: event.id, type: event.type },
    });
  } catch (error) {
    // Concurrent delivery of the same event already recorded it.
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== "P2002"
    ) {
      throw error;
    }
  }
}
