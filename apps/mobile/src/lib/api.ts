/**
 * Tiny Payload REST client.
 *
 * The app is a Capacitor WebView, so "same origin" is the device bundle — every
 * request therefore needs an absolute CMS origin. `VITE_API_URL` supplies it at
 * build time (see .env.example); when it is empty the client falls back to a
 * relative path, which is what the Vite dev server proxies to Next so the app
 * can be developed against the real Payload instance on localhost.
 */
const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Payload returns `{ docs: [...] }` for collections; this narrows that shape. */
interface PayloadList<T> {
  docs: T[];
}

// A cold CMS route (dev server compiling, or a sleeping backend) can take well
// over ten seconds, so the first attempt is patient and the second is a retry on
// a shorter clock. The seeded fixtures cover the screen while this runs.
const TIMEOUT_MS = 15000;
const RETRY_TIMEOUT_MS = 8000;

async function request<T>(path: string, query: URLSearchParams, timeout: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_BASE}/api${path}?${query.toString()}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new ApiError(`GET ${path} failed`, response.status);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function apiGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const query = new URLSearchParams({ depth: "0", limit: "100", ...params });
  try {
    return await request<T>(path, query, TIMEOUT_MS);
  } catch (first) {
    if (first instanceof ApiError && first.status && first.status < 500) throw first;
    try {
      return await request<T>(path, query, RETRY_TIMEOUT_MS);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(error instanceof Error ? error.message : "Network request failed");
    }
  }
}

export async function apiList<T>(path: string, params?: Record<string, string>): Promise<T[]> {
  const data = await apiGet<PayloadList<T>>(path, params);
  return Array.isArray(data.docs) ? data.docs : [];
}

/** Resolves a Payload-relative media path against the CMS origin. */
export function mediaUrl(src: string): string {
  if (!src) return "";
  if (/^https?:\/\//.test(src) || src.startsWith("data:")) return src;
  return `${API_BASE}${src.startsWith("/") ? "" : "/"}${src}`;
}
