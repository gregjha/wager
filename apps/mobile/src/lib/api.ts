/**
 * Resolve the Wager REST API base URL (includes `/api`, no trailing slash).
 */
export function resolveApiBase(): string {
  const authOrigin = process.env.EXPO_PUBLIC_AUTH_ORIGIN?.trim().replace(
    /\/$/,
    "",
  );
  if (authOrigin) {
    return `${authOrigin}/api`;
  }
  return "http://127.0.0.1:3000/api";
}

export function apiUrl(path: string): string {
  const base = resolveApiBase();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
