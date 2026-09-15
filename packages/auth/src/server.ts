import { betterAuth } from "better-auth";

import { wagerBetterAuthOptions } from "./auth-options-core";

/** Node Better Auth instance (no Next.js cookie bridging). */
export const auth = betterAuth(wagerBetterAuthOptions);
