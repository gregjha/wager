import type { ApiError } from "./api/errors";

export type ApiRequestOptions = {
  searchParams?: Record<string, string | number | null | undefined>;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  body?: unknown;
};

export type ApiClientConfig = {
  baseUrl?: string;
  getHeaders?: () => Record<string, string> | Promise<Record<string, string>>;
  credentials?: RequestCredentials;
};

function buildUrl(
  path: string,
  baseUrl: string | undefined,
  searchParams?: ApiRequestOptions["searchParams"],
) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const origin =
    baseUrl ??
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  const url = new URL(`${origin}${normalizedPath}`);

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

async function apiRequest<T>(
  method: string,
  path: string,
  config: ApiClientConfig,
  options: ApiRequestOptions = {},
): Promise<T> {
  const extraHeaders = config.getHeaders ? await config.getHeaders() : {};
  const response = await fetch(buildUrl(path, config.baseUrl, options.searchParams), {
    method,
    credentials: options.credentials ?? config.credentials ?? "include",
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
      ...options.headers,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const errorBody = (await response.json()) as ApiError;
      if (errorBody.error) message = errorBody.error;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function createApiClient(config: ApiClientConfig = {}) {
  return {
    get: <T>(path: string, options?: ApiRequestOptions) =>
      apiRequest<T>("GET", path, config, options),
    post: <T>(path: string, options?: ApiRequestOptions) =>
      apiRequest<T>("POST", path, config, options),
    patch: <T>(path: string, options?: ApiRequestOptions) =>
      apiRequest<T>("PATCH", path, config, options),
    delete: <T>(path: string, options?: ApiRequestOptions) =>
      apiRequest<T>("DELETE", path, config, options),
  };
}

/** Browser client — relative `/api` paths with session cookies. */
export const webApiClient = createApiClient({
  baseUrl: typeof window !== "undefined" ? window.location.origin : undefined,
  credentials: "include",
});
