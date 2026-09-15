import "server-only";

import { getStripe } from "./client";

/**
 * Fully refunds an entry. Reverses the transfer to the host and returns the
 * platform fee so the player gets every cent back.
 */
export async function refundEntryPayment(
  paymentIntentId: string,
  entryId: string,
): Promise<string> {
  const refund = await getStripe().refunds.create(
    {
      payment_intent: paymentIntentId,
      reverse_transfer: true,
      refund_application_fee: true,
      metadata: { entryId },
    },
    { idempotencyKey: `entry-refund-${entryId}-${paymentIntentId}` },
  );
  return refund.id;
}
