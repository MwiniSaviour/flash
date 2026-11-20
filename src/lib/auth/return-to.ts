/**
 * The sign-in return path.
 *
 * Only a local path may be used after sign-in. A protocol-relative `//` or an
 * absolute URL would send the visitor off-site, so both are rejected.
 */
export function safeReturnPath(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  if (raw.includes("://") || raw.includes("\\")) return "/";
  return raw;
}

export function signInHref(returnPath: string): string {
  return `/sign-in?redirect_url=${encodeURIComponent(safeReturnPath(returnPath))}`;
}

export function signUpHref(returnPath: string): string {
  return `/sign-up?redirect_url=${encodeURIComponent(safeReturnPath(returnPath))}`;
}
