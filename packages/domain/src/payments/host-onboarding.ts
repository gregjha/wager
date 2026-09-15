import "server-only";

import type { PayoutStatus } from "@bi/shared";
import { prisma } from "@bi/db";
import {
  createConnectedAccount,
  createOnboardingLink,
  isAccountPayoutReady,
} from "@bi/payments";

import { NotFoundError } from "../auth/errors";

/**
 * Ensures the user has a Stripe Connect account and returns a fresh
 * onboarding link for it.
 */
export async function startHostOnboarding(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, stripeAccountId: true },
  });
  if (!user) throw new NotFoundError("User not found");

  let accountId = user.stripeAccountId;
  if (!accountId) {
    accountId = await createConnectedAccount({ userId, email: user.email });
    await prisma.user.update({
      where: { id: userId },
      data: { stripeAccountId: accountId },
    });
  }

  return createOnboardingLink(accountId);
}

/**
 * Reads payout readiness. When the account exists but isn't marked ready,
 * checks Stripe directly so hosts returning from onboarding don't wait on
 * the `account.updated` webhook.
 */
export async function getPayoutStatus(userId: string): Promise<PayoutStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeAccountId: true, stripePayoutsReady: true },
  });
  if (!user?.stripeAccountId) {
    return { connected: false, payoutsReady: false };
  }
  if (user.stripePayoutsReady) {
    return { connected: true, payoutsReady: true };
  }

  const ready = await isAccountPayoutReady(user.stripeAccountId);
  if (ready) {
    await prisma.user.update({
      where: { id: userId },
      data: { stripePayoutsReady: true },
    });
  }
  return { connected: true, payoutsReady: ready };
}
