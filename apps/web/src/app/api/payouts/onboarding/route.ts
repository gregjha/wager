import type { OnboardingLinkResponse } from "@bi/shared";
import { startHostOnboarding } from "@bi/domain";

import { requireUserId } from "@/lib/api/route-handler";
import { handleDomainError, jsonResponse } from "@/lib/api/json-response";

/** Returns a single-use Stripe Connect onboarding URL (mobile opens it in a browser). */
export async function POST(request: Request) {
  try {
    const userId = await requireUserId(request);
    const url = await startHostOnboarding(userId);
    return jsonResponse<OnboardingLinkResponse>({ url });
  } catch (error) {
    return handleDomainError(error);
  }
}
