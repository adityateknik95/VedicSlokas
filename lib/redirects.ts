/**
 * Open-redirect protection for ?callbackUrl= and similar parameters.
 * Only same-origin paths under an allowlist are accepted; anything else falls back.
 */

export const DEFAULT_AFTER_LOGIN = "/dashboard";

/** Where a signed-in user may be sent back to. Auth pages themselves are excluded to avoid loops. */
const ALLOWED_PREFIXES = ["/dashboard", "/library", "/translate", "/sloka/", "/about"] as const;
const ALLOWED_EXACT = new Set(["/"]);

const PLACEHOLDER_ORIGIN = "https://vedicslokas.invalid";

/** "/sloka/" matches /sloka/x but not /sloka/; "/dashboard" matches itself and anything below it. */
function isUnder(path: string, prefix: string): boolean {
  if (prefix.endsWith("/")) return path.startsWith(prefix) && path.length > prefix.length;
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function safeCallbackUrl(input: unknown, fallback: string = DEFAULT_AFTER_LOGIN): string {
  if (typeof input !== "string") return fallback;
  const raw = input.trim();
  if (!raw || raw.length > 512) return fallback;
  // Must be a plain absolute path: no scheme, no protocol-relative "//", no backslashes, no control chars.
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\") || /[\u0000-\u001f\u007f]/.test(raw)) return fallback;

  let url: URL;
  try {
    url = new URL(raw, PLACEHOLDER_ORIGIN);
  } catch {
    return fallback;
  }
  if (url.origin !== PLACEHOLDER_ORIGIN) return fallback;

  const path = url.pathname;
  // Reject encoded tricks that normalise to something else (e.g. /%2F%2Fevil.com).
  if (path.startsWith("//") || /%2f|%5c/i.test(raw.split("?")[0])) return fallback;

  if (!ALLOWED_EXACT.has(path) && !ALLOWED_PREFIXES.some((p) => isUnder(path, p))) return fallback;
  return `${path}${url.search}${url.hash}`;
}
