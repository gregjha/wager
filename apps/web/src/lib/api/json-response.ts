import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { ZodError } from "zod";

import { apiErrorCodes, type ApiError } from "@bi/shared";
import {
  ConflictError,
  ForbiddenError,
  MatchFullError,
  NotFoundError,
  PayoutsNotReadyError,
  UnauthorizedError,
} from "@bi/domain";

export function jsonResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(error: string, status: number, code?: string) {
  const body: ApiError = code ? { error, code } : { error };
  return NextResponse.json(body, { status });
}

export async function readJsonBody(request: Request): Promise<unknown> {
  const text = await request.text();
  if (!text) return undefined;
  return JSON.parse(text);
}

export function handleDomainError(error: unknown) {
  // Cache Components / PPR bailouts must not become API 500s.
  unstable_rethrow(error);

  if (error instanceof UnauthorizedError) {
    return jsonError(error.message, 401, apiErrorCodes.UNAUTHORIZED);
  }
  if (error instanceof ForbiddenError) {
    return jsonError(error.message, 403, apiErrorCodes.FORBIDDEN);
  }
  if (error instanceof NotFoundError) {
    return jsonError(error.message, 404, apiErrorCodes.NOT_FOUND);
  }
  if (error instanceof MatchFullError) {
    return jsonError(error.message, 409, apiErrorCodes.MATCH_FULL);
  }
  if (error instanceof PayoutsNotReadyError) {
    return jsonError(error.message, 409, apiErrorCodes.PAYOUTS_NOT_READY);
  }
  if (error instanceof ConflictError) {
    return jsonError(error.message, 409, apiErrorCodes.CONFLICT);
  }
  if (error instanceof ZodError) {
    return jsonError(
      error.issues[0]?.message ?? "Invalid request body",
      400,
      apiErrorCodes.INVALID_REQUEST_BODY,
    );
  }
  if (error instanceof SyntaxError) {
    return jsonError("Invalid JSON", 400, apiErrorCodes.INVALID_REQUEST_BODY);
  }
  if (error instanceof Error && error.message === "Invalid cursor") {
    return jsonError(error.message, 400, apiErrorCodes.BAD_REQUEST);
  }
  console.error(error);
  return jsonError("Internal server error", 500);
}
