/**
 * Server session helper (replaces NextAuth `auth()` ergonomics).
 */

import "server-only";

import { headers } from "next/headers";

import { auth as betterAuth } from "@bi/auth/next";

export async function auth() {
  return betterAuth.api.getSession({ headers: await headers() });
}
