import "server-only";

import type Stripe from "stripe";

import { getStripe } from "./client";
import { getStripeWebhookSecret } from "./env";

/**
 * Verifies the Stripe signature. Pass the raw request body, not parsed JSON.
 *
 * @throws Error when the signature is invalid.
 */
export function constructWebhookEvent(
  rawBody: string,
  signature: string,
): Stripe.Event {
  return getStripe().webhooks.constructEvent(
    rawBody,
    signature,
    getStripeWebhookSecret(),
  );
}

export type { Stripe };
