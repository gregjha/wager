import "server-only";

import { platformFeeCents } from "@bi/shared";

import { getStripe } from "./client";

/** Stripe requires Checkout sessions to live at least 30 minutes. */
export const CHECKOUT_HOLD_MINUTES = 30;

export type EntryCheckoutParams = {
  entryId: string;
  matchId: string;
  userId: string;
  matchTitle: string;
  amountCents: number;
  currency: string;
  hostAccountId: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  expiresAt: Date;
};

/**
 * Creates a Checkout Session as a destination charge: the host's connected
 * account receives the entry fee minus the platform fee.
 */
export async function createEntryCheckoutSession(
  params: EntryCheckoutParams,
): Promise<{ id: string; url: string }> {
  const session = await getStripe().checkout.sessions.create(
    {
      mode: "payment",
      customer_email: params.customerEmail,
      client_reference_id: params.entryId,
      expires_at: Math.floor(params.expiresAt.getTime() / 1000),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: params.currency,
            unit_amount: params.amountCents,
            product_data: { name: `Entry: ${params.matchTitle}` },
          },
        },
      ],
      payment_intent_data: {
        application_fee_amount: platformFeeCents(params.amountCents),
        transfer_data: { destination: params.hostAccountId },
        metadata: {
          entryId: params.entryId,
          matchId: params.matchId,
          userId: params.userId,
        },
      },
      metadata: {
        entryId: params.entryId,
        matchId: params.matchId,
        userId: params.userId,
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    },
    // One live session per hold window for this entry row.
    { idempotencyKey: `entry-checkout-${params.entryId}-${params.expiresAt.getTime()}` },
  );

  if (!session.url) {
    throw new Error("Stripe did not return a Checkout URL");
  }

  return { id: session.id, url: session.url };
}

/** Best-effort: close an abandoned session so the player can't pay late. */
export async function expireCheckoutSession(sessionId: string): Promise<void> {
  try {
    await getStripe().checkout.sessions.expire(sessionId);
  } catch (err) {
    // Already completed or expired — the webhook reconciles either way.
    console.warn("[stripe] expire session failed:", err);
  }
}
