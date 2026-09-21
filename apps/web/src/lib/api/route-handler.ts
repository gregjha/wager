import { auth as betterAuth } from "@wager/auth/next";

import { UnauthorizedError } from "@wager/domain";

export async function requireUserId(request: Request): Promise<string> {
  const session = await betterAuth.api.getSession({
    headers: request.headers,
  });
  if (!session?.user?.id) {
    throw new UnauthorizedError("Unauthorized. Please log in.");
  }
  return session.user.id;
}

export async function getOptionalUserId(
  request: Request,
): Promise<string | null> {
  const session = await betterAuth.api.getSession({
    headers: request.headers,
  });
  return session?.user?.id ?? null;
}
