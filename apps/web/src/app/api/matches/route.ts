import { createMatchInputSchema } from "@bi/shared";
import { createMatchForUser, listMatches } from "@bi/domain";

import { getOptionalUserId, requireUserId } from "@/lib/api/route-handler";
import { handleDomainError, jsonResponse } from "@/lib/api/json-response";
import { parseMatchesListQuery } from "@/lib/api/list-query";

export async function GET(request: Request) {
  try {
    const query = parseMatchesListQuery(request);
    const viewerUserId = await getOptionalUserId(request);
    const connection = await listMatches({ ...query, viewerUserId });
    return jsonResponse(connection);
  } catch (error) {
    return handleDomainError(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId(request);
    const body = await request.json();
    const input = createMatchInputSchema.parse(body);
    const match = await createMatchForUser(userId, input);
    return jsonResponse(match, 201);
  } catch (error) {
    return handleDomainError(error);
  }
}
