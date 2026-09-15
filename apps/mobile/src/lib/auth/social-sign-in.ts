import { useEffect, useState } from "react";

import { authClient } from "./auth-client";

export type SocialProvider = "google" | "reddit";

export type SocialSignInStatus = "idle" | "unconfigured" | "busy" | "error";

export interface UseSocialSignInResult {
  status: SocialSignInStatus;
  error: string | null;
  signIn: () => Promise<void>;
}

const UNCONFIGURED_MSG =
  "Set EXPO_PUBLIC_AUTH_ORIGIN to your Next.js origin.";

/**
 * Starts Better Auth OAuth via the Next app (`EXPO_PUBLIC_AUTH_ORIGIN` + expo plugin).
 */
export function useSocialSignIn(provider: SocialProvider): UseSocialSignInResult {
  const configured = Boolean(process.env.EXPO_PUBLIC_AUTH_ORIGIN?.trim());

  const [status, setStatus] = useState<SocialSignInStatus>(
    configured ? "idle" : "unconfigured",
  );
  const [error, setError] = useState<string | null>(
    configured ? null : UNCONFIGURED_MSG,
  );

  useEffect(() => {
    void authClient.getSession().catch(() => undefined);
  }, []);

  async function signIn() {
    if (!configured) return;
    setError(null);
    setStatus("busy");
    try {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: "/",
      });
      const errMsg = result.error?.message;
      if (errMsg) {
        setStatus("error");
        setError(errMsg);
        return;
      }
      await authClient.getSession();
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Sign-in failed");
    }
  }

  return {
    status,
    error,
    signIn,
  };
}
