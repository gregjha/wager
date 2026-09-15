import "server-only";

import { getStripe } from "./client";
import { getAppOrigin } from "./env";

/**
 * Creates a Stripe Connect Express account for a host.
 *
 * @returns The new connected account id (`acct_...`).
 */
export async function createConnectedAccount({
  userId,
  email,
}: {
  userId: string;
  email: string;
}): Promise<string> {
  const account = await getStripe().accounts.create(
    {
      type: "express",
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        product_description: "Recreational sports match entry fees",
      },
      metadata: { userId },
    },
    { idempotencyKey: `connect-account-${userId}` },
  );
  return account.id;
}

/** One-time hosted onboarding link. Links expire, so create one per click. */
export async function createOnboardingLink(accountId: string): Promise<string> {
  const origin = getAppOrigin();
  const link = await getStripe().accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${origin}/host/payouts?refresh=1`,
    return_url: `${origin}/host/payouts?done=1`,
  });
  return link.url;
}

export async function isAccountPayoutReady(accountId: string): Promise<boolean> {
  const account = await getStripe().accounts.retrieve(accountId);
  return Boolean(account.charges_enabled && account.details_submitted);
}
