import { constructWebhookEvent, type Stripe } from "@wager/payments";
import { handleStripeEvent } from "@wager/domain";

import { jsonError, jsonResponse } from "@/lib/api/json-response";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return jsonError("Missing Stripe signature", 400);
  }

  let event: Stripe.Event;
  try {
    // Signature verification needs the exact raw body.
    event = constructWebhookEvent(await request.text(), signature);
  } catch {
    return jsonError("Invalid Stripe signature", 400);
  }

  try {
    await handleStripeEvent(event);
    return jsonResponse({ received: true });
  } catch (error) {
    console.error("[stripe webhook]", event.type, error);
    // Non-2xx makes Stripe retry with backoff.
    return jsonError("Webhook handler failed", 500);
  }
}
