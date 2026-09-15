import { joinMatchBodySchema } from "@bi/shared";
import { joinMatch, leaveMatch } from "@bi/domain";

import { requireUserId } from "@/lib/api/route-handler";
import {
  handleDomainError,
  jsonResponse,
  readJsonBody,
} from "@/lib/api/json-response";

type RouteContext = { params: Promise<{ id: string }> };

/** Join: `{ kind: "confirmed" }` for free matches, `{ kind: "checkout", url }` for paid. */
export async function POST(request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId(request);
    const { id } = await context.params;
    const body = joinMatchBodySchema.parse(await readJsonBody(request));
    const result = await joinMatch(userId, id, body);
    return jsonResponse(result, result.kind === "confirmed" ? 201 : 200);
  } catch (error) {
    return handleDomainError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId(request);
    const { id } = await context.params;
    const result = await leaveMatch(userId, id);
    return jsonResponse(result);
  } catch (error) {
    return handleDomainError(error);
  }
}
