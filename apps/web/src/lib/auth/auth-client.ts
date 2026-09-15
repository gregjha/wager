"use client";

import { createAuthClient } from "better-auth/react";

const raw = process.env.NEXT_PUBLIC_APP_ORIGIN?.replace(/\/$/, "");

/** Browser uses same-origin `/api/auth`; set `NEXT_PUBLIC_APP_ORIGIN` when the client SSR or tests need an absolute URL. */
export const authClient = createAuthClient(
  raw ? { baseURL: raw } : {},
);
