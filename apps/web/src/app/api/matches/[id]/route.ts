import { apiErrorCodes, updateMatchInputSchema } from "@wager/shared";
import {
  cancelMatchForUser,
  getMatchById,
  updateMatchForUser,
} from "@wager/domain";

import { getOptionalUserId, requireUserId } from "@/lib/api/route-handler";
import {
  handleDomainError,
  jsonError,
  jsonResponse,
} from "@/lib/api/json-response";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const viewerUserId = await getOptionalUserId(request);
    const match = await getMatchById(id, viewerUserId);

    if (!match) {
      return jsonError("Match not found", 404, apiErrorCodes.NOT_FOUND);
    }

    return jsonResponse(match);
  } catch (error) {
    return handleDomainError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId(request);
    const { id } = await context.params;
    const body = await request.json();
    const input = updateMatchInputSchema.parse({ ...body, id });
    const match = await updateMatchForUser(userId, input);
    return jsonResponse(match);
  } catch (error) {
    return handleDomainError(error);
  }
}

/** Cancels the match (soft) and refunds paid players. */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId(request);
    const { id } = await context.params;
    const result = await cancelMatchForUser(userId, id);
    return jsonResponse(result);
  } catch (error) {
    return handleDomainError(error);
  }
}
