import { z } from "zod";

import { MAX_ENTRY_FEE_CENTS, MIN_ENTRY_FEE_CENTS } from "./money";
import { skillLevelSchema, sportSchema } from "./sports";

const entryFeeCentsSchema = z.coerce
  .number()
  .int()
  .refine(
    (cents) =>
      cents === 0 ||
      (cents >= MIN_ENTRY_FEE_CENTS && cents <= MAX_ENTRY_FEE_CENTS),
    {
      message: `Entry fee must be free or between $${MIN_ENTRY_FEE_CENTS / 100} and $${MAX_ENTRY_FEE_CENTS / 100}`,
    },
  );

/**
 * Common match fields shared by create and update flows on the server.
 * `startsAt` is an ISO-8601 string on the wire, coerced to Date here.
 */
export const matchInputBaseSchema = z.strictObject({
  title: z.string().trim().min(3).max(80),
  description: z.string().trim().max(2000).default(""),
  sport: sportSchema,
  skillLevel: skillLevelSchema,
  startsAt: z.coerce
    .date()
    .refine((d) => d.getTime() > Date.now(), "Start time must be in the future"),
  durationMinutes: z.coerce.number().int().min(15).max(600),
  venueName: z.string().trim().nonempty("Add the venue name"),
  address: z.string().trim().nonempty("Add an address"),
  city: z.string().trim().nonempty("Add a city"),
  capacity: z.coerce.number().int().min(2).max(64),
  entryFeeCents: entryFeeCentsSchema,
  refundCutoffHours: z.coerce.number().int().min(0).max(168).default(24),
});

export const createMatchInputSchema = matchInputBaseSchema;

/**
 * Server-action / REST payload for updating a match. Fee and capacity
 * changes are validated against existing entries in `@bi/domain`.
 */
export const updateMatchInputSchema = matchInputBaseSchema.partial().extend({
  id: z.string().cuid(),
});

// --- Client-form schema: money is typed as dollars, time as local input ---

export const matchFormSchema = z.object({
  title: z.string().trim().min(3, "Title needs at least 3 characters").max(80),
  description: z.string().trim().max(2000),
  sport: sportSchema,
  skillLevel: skillLevelSchema,
  /** `<input type="datetime-local">` value, interpreted in the browser's zone. */
  startsAtLocal: z.string().nonempty("Pick a start time"),
  durationMinutes: z.coerce.number<string | number>().int().min(15).max(600),
  venueName: z.string().trim().nonempty("Add the venue name"),
  address: z.string().trim().nonempty("Add an address"),
  city: z.string().trim().nonempty("Add a city"),
  capacity: z.coerce.number<string | number>().int().min(2).max(64),
  entryFeeDollars: z
    .string()
    .trim()
    .regex(/^$|^\d+(\.\d{1,2})?$/, "Use a dollar amount like 10 or 12.50"),
  refundCutoffHours: z.coerce.number<string | number>().int().min(0).max(168),
});

export type CreateMatchInput = z.infer<typeof createMatchInputSchema>;
export type UpdateMatchInput = z.infer<typeof updateMatchInputSchema>;
export type MatchFormData = z.infer<typeof matchFormSchema>;
export type MatchFormInput = z.input<typeof matchFormSchema>;
