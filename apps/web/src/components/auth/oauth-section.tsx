"use client";

import { useState, type TransitionStartFunction } from "react";
import { FaGoogle, FaReddit } from "react-icons/fa6";

import { authClient } from "@/lib/auth/auth-client";

import OAuthButton from "./oauth-button";

type SocialProvider = "google" | "reddit";

type Props = Readonly<{
  action: "login" | "register";
  isLoading: boolean;
  startTransition: TransitionStartFunction;
}>;

export default function OAuthSection({
  action,
  isLoading,
  startTransition,
}: Props) {
  const actionText = action === "register" ? "Sign up" : "Sign in";
  const [error, setError] = useState<string | null>(null);

  async function signInWith(provider: SocialProvider) {
    setError(null);
    const { error: authError } = await authClient.signIn.social({
      provider,
      callbackURL: "/",
    });
    if (authError) {
      setError(authError.message ?? `${actionText} failed`);
    }
  }

  function handleSocial(provider: SocialProvider) {
    startTransition(async () => {
      try {
        await signInWith(provider);
      } catch (e) {
        setError(e instanceof Error ? e.message : `${actionText} failed`);
      }
    });
  }

  return (
    <div className="flex flex-col gap-y-4 mb-6">
      {error ? (
        <p className="text-sm text-destructive text-center" role="alert">
          {error}
        </p>
      ) : null}
      <OAuthButton
        disabled={isLoading}
        label={`${actionText} with Google`}
        Icon={FaGoogle}
        onClick={() => handleSocial("google")}
      />
      <OAuthButton
        disabled={isLoading}
        label={`${actionText} with Reddit`}
        Icon={FaReddit}
        onClick={() => handleSocial("reddit")}
      />
    </div>
  );
}
