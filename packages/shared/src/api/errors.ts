import { z } from "zod";

export const apiErrorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

export const apiErrorCodes = {
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  BAD_REQUEST: "BAD_REQUEST",
  INVALID_REQUEST_BODY: "INVALID_REQUEST_BODY",
  CONFLICT: "CONFLICT",
  MATCH_FULL: "MATCH_FULL",
  PAYOUTS_NOT_READY: "PAYOUTS_NOT_READY",
} as const;
