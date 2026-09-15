import { listHostingMatches } from "@bi/domain";

import { requireUserId } from "@/lib/api/route-handler";
import { handleDomainError, jsonResponse } from "@/lib/api/json-response";
import { parsePaginationQuery } from "@/lib/api/list-query";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId(request);
    const query = parsePaginationQuery(request);
    const connection = await listHostingMatches(userId, query);
    return jsonResponse(connection);
  } catch (error) {
    return handleDomainError(error);
  }
}
