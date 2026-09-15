/**
 * Resolves the first non-empty environment variable value from the provided keys.
 */
export function envStr(keys: readonly string[]): string {
  for (const k of keys) {
    const v = process.env[k];
    if (v?.trim()) return v.trim();
  }
  return "";
}

export function requireEnv(keys: readonly string[]): string {
  const v = envStr(keys);
  if (!v) {
    throw new Error(
      `Missing required env: ${keys[0]} (fallbacks ${keys.slice(1).join(", ") || "none"})`,
    );
  }
  return v;
}

export function getStripeSecretKey(): string {
  return requireEnv(["STRIPE_SECRET_KEY"]);
}

export function getStripeWebhookSecret(): string {
  return requireEnv(["STRIPE_WEBHOOK_SECRET"]);
}

/** Public web origin used for Checkout / Connect return URLs. */
export function getAppOrigin(): string {
  return (
    envStr(["BETTER_AUTH_URL", "NEXT_PUBLIC_APP_ORIGIN"]) ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}
