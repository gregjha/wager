import "server-only";

import Stripe from "stripe";

import { getStripeSecretKey } from "./env";

let stripeClient: Stripe | undefined;

/**
 * Provides the configured Stripe client (lazy so builds don't need secrets).
 */
export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey(), {
      appInfo: { name: "Wager" },
      maxNetworkRetries: 2,
    });
  }
  return stripeClient;
}
