import { z } from "zod";

export const payoutStatusSchema = z.object({
  connected: z.boolean(),
  payoutsReady: z.boolean(),
});

export type PayoutStatus = z.infer<typeof payoutStatusSchema>;

export const onboardingLinkResponseSchema = z.object({
  url: z.string().url(),
});

export type OnboardingLinkResponse = z.infer<typeof onboardingLinkResponseSchema>;
