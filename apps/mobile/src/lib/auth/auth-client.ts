import * as SecureStore from "expo-secure-store";
import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";

const baseURL = (process.env.EXPO_PUBLIC_AUTH_ORIGIN ?? "")
  .trim()
  .replace(/\/$/, "");

if (!baseURL) {
  console.warn("[auth] EXPO_PUBLIC_AUTH_ORIGIN is not set.");
}

export const authClient = createAuthClient({
  baseURL: baseURL || "http://127.0.0.1:3000",
  plugins: [
    expoClient({
      scheme: "wager",
      storagePrefix: "wager",
      storage: SecureStore,
    }),
  ],
});

/** Cookie string persisted by `@better-auth/expo` — forward to REST. */
export async function getAuthCookie(): Promise<string> {
  if ("getCookie" in authClient && typeof authClient.getCookie === "function") {
    return (await authClient.getCookie()) ?? "";
  }
  return "";
}
