import { getPayoutStatus } from "@wager/domain";

import { requireUserId } from "@/lib/api/route-handler";
import { handleDomainError, jsonResponse } from "@/lib/api/json-response";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId(request);
    return jsonResponse(await getPayoutStatus(userId));
  } catch (error) {
    return handleDomainError(error);
  }
}
