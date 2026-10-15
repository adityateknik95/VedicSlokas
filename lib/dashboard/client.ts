"use client";

/**
 * Browser helper for /api/me/*. JSON in, typed JSON out. When the session has ended
 * (expired, signed out elsewhere, account deleted in another tab) it sends the student to
 * log in and brings them back to the same page afterwards.
 */

export class MeError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}

export function goToLogin(): void {
  const here = `${window.location.pathname}${window.location.search}`;
  window.location.assign(`/login?callbackUrl=${encodeURIComponent(here)}&expired=1`);
}

export async function meFetch<T>(path: string, init: { method?: "GET" | "POST" | "PATCH"; body?: unknown; keepalive?: boolean; signal?: AbortSignal } = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: init.method ?? (init.body === undefined ? "GET" : "POST"),
      headers: init.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      credentials: "same-origin",
      cache: "no-store",
      keepalive: init.keepalive,
      signal: init.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new MeError(0, "offline");
  }
  if (response.status === 401) {
    goToLogin();
    throw new MeError(401, "unauthenticated");
  }
  if (!response.ok) {
    let code = "server_error";
    try {
      code = ((await response.json()) as { error?: string }).error ?? code;
    } catch {
      // Not JSON: keep the generic code.
    }
    throw new MeError(response.status, code);
  }
  return (await response.json()) as T;
}

/** A short, kind message for a failed request. */
export function failureMessage(error: unknown, action: string): string {
  if (error instanceof MeError) {
    if (error.code === "offline") return `You seem to be offline, so we couldn't ${action}. Try again when you're connected.`;
    if (error.code === "rate_limited") return `That was a lot at once. Wait a moment, then try to ${action} again.`;
  }
  return `We couldn't ${action} just now. Please try again.`;
}

/** Reads the readable "probably signed in" hint cookie (set and cleared by the auth flow). */
export function hasSessionHint(): boolean {
  return typeof document !== "undefined" && document.cookie.split("; ").some((c) => c === "vs_signed_in=1");
}

/** The browser's IANA timezone, e.g. "Asia/Kolkata". */
export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
