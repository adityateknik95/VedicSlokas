import "server-only";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { siteOrigin } from "@/lib/env";
import { checkLimits, type RuleName } from "@/lib/rate-limit";
import { getSession, type Session } from "@/lib/session";

/**
 * The one way /api/me/* handlers run:
 * - the user always comes from the validated session, never from the request body,
 * - writes must come from this site (Origin check; cookies are SameSite=Lax as well),
 * - per-user rate limits on writes,
 * - zod-validated input, typed JSON out, never cached.
 */

const NO_STORE = { "Cache-Control": "no-store, max-age=0", "X-Content-Type-Options": "nosniff" };

export type ApiErrorCode = "unauthenticated" | "forbidden" | "reauth_required" | "rate_limited" | "invalid" | "server_error";
export type ApiError = { error: ApiErrorCode; retryAt?: number; issues?: string[] };

export function json<T>(body: T, status = 200, headers: Record<string, string> = {}): NextResponse<T> {
  return NextResponse.json(body, { status, headers: { ...NO_STORE, ...headers } });
}

const fail = (error: ApiErrorCode, status: number, extra: Omit<ApiError, "error"> = {}) => json<ApiError>({ error, ...extra }, status);

class Invalid extends Error {
  constructor(readonly issues: string[]) {
    super("invalid");
  }
}

/** Parses and validates a JSON body. sendBeacon posts arrive as text, so both are accepted. */
export async function readBody<S extends z.ZodType>(request: Request, schema: S): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    const text = await request.text();
    raw = text ? JSON.parse(text) : {};
  } catch {
    throw new Invalid(["Body must be JSON"]);
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw new Invalid(parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`));
  return parsed.data;
}

/** Validates query parameters with the same rules as bodies. */
export function readQuery<S extends z.ZodType>(request: Request, schema: S): z.infer<S> {
  const parsed = schema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) throw new Invalid(parsed.error.issues.map((i) => `${i.path.join(".") || "query"}: ${i.message}`));
  return parsed.data;
}

/** How recently a student must have signed in to do something permanent, like deleting the account. */
export const RECENT_SIGN_IN_MS = 60 * 60 * 1000;

/**
 * True when this session began (a fresh sign-in) within RECENT_SIGN_IN_MS. Sessions last
 * 30 days, so a cookie left on a shared computer, or stolen, must not be enough on its own.
 */
export function signedInRecently(session: { session: { createdAt: Date | string } }, now = Date.now()): boolean {
  const started = new Date(session.session.createdAt).getTime();
  return Number.isFinite(started) && now - started <= RECENT_SIGN_IN_MS;
}

/** The response for an action that needs a fresh sign-in first. */
export const reauthRequired = () => fail("reauth_required", 403);

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  return origin === siteOrigin() || origin === new URL(request.url).origin;
}

type Handler = (ctx: { request: Request; session: Session }) => Promise<Response>;

export function meRoute(handler: Handler, options: { limit?: RuleName } = {}) {
  return async (request: Request): Promise<Response> => {
    const isWrite = request.method !== "GET" && request.method !== "HEAD";
    if (isWrite && !sameOrigin(request)) return fail("forbidden", 403);

    const session = await getSession();
    if (!session) return fail("unauthenticated", 401);

    if (options.limit) {
      const limited = await checkLimits([[options.limit, session.user.id]]);
      if (!limited.success) return fail("rate_limited", 429, { retryAt: limited.reset });
    }

    try {
      return await handler({ request, session });
    } catch (error) {
      if (error instanceof Invalid) return fail("invalid", 400, { issues: error.issues });
      console.error("[api/me] request failed", request.method, new URL(request.url).pathname, error instanceof Error ? error.message : error);
      Sentry.captureException(error, { tags: { route: new URL(request.url).pathname, method: request.method } });
      return fail("server_error", 500);
    }
  };
}
