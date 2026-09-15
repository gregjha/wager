import { z } from "zod";

import {
  entryStatusSchema,
  matchStatusSchema,
  skillLevelSchema,
  sportSchema,
} from "../sports";
import { connectionSchema } from "./pagination";

export const hostDtoSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  image: z.string().nullable(),
});

export type HostDTO = z.infer<typeof hostDtoSchema>;

export const rosterPlayerDtoSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  image: z.string().nullable(),
});

export type RosterPlayerDTO = z.infer<typeof rosterPlayerDtoSchema>;

export const matchDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  sport: sportSchema,
  skillLevel: skillLevelSchema,
  status: matchStatusSchema,
  /** ISO-8601 */
  startsAt: z.string(),
  durationMinutes: z.number().int(),
  venueName: z.string(),
  address: z.string(),
  city: z.string(),
  capacity: z.number().int(),
  entryFeeCents: z.number().int(),
  currency: z.string(),
  refundCutoffHours: z.number().int(),
  host: hostDtoSchema,
  /** Confirmed players plus unexpired checkout holds. */
  spotsTaken: z.number().int(),
  /** The viewer's own entry status, or null when anonymous / not joined. */
  viewerEntryStatus: entryStatusSchema.nullable(),
});

export type MatchDTO = z.infer<typeof matchDtoSchema>;

export const matchDetailDtoSchema = matchDtoSchema.extend({
  roster: z.array(rosterPlayerDtoSchema),
});

export type MatchDetailDTO = z.infer<typeof matchDetailDtoSchema>;

export const matchConnectionSchema = connectionSchema(matchDtoSchema);
export type MatchConnection = z.infer<typeof matchConnectionSchema>;

export const matchesListQuerySchema = z.object({
  first: z.coerce.number().int().min(1).max(100).default(24),
  after: z.string().optional(),
  search: z.string().optional(),
  sport: sportSchema.optional(),
  city: z.string().optional(),
  /** "free" | "paid" — omit for both. */
  price: z.enum(["free", "paid"]).optional(),
});

export type MatchesListQuery = z.infer<typeof matchesListQuerySchema>;

/**
 * Result of `POST /api/matches/:id/entry`.
 * Free matches confirm immediately; paid matches return a Checkout URL.
 */
export const joinMatchResponseSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("confirmed") }),
  z.object({ kind: z.literal("checkout"), url: z.string().url() }),
]);

export type JoinMatchResponse = z.infer<typeof joinMatchResponseSchema>;

export const joinMatchBodySchema = z
  .object({
    /** Where Stripe should send the player back (web origin or mobile deep link). */
    returnUrl: z.string().url().optional(),
  })
  .default({});

export type JoinMatchBody = z.infer<typeof joinMatchBodySchema>;

export const leaveMatchResponseSchema = z.object({
  refunded: z.boolean(),
});

export type LeaveMatchResponse = z.infer<typeof leaveMatchResponseSchema>;
