/** Env reads shared by `@bi/auth` — keep tiny; no secrets in logs. */

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
