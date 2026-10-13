import "server-only";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { audit } from "./audit";
import { getAuth } from "./auth";
import { noAccountEmail } from "./email/templates";
import { sendEmail } from "./email/send";
import { env, siteOrigin } from "./env";
import { inspectToken, invalidatePendingLinks } from "./magic-token";
import { checkLimits } from "./rate-limit";
import type { RequestMeta } from "./request-meta";
import { DEFAULT_AFTER_LOGIN } from "./redirects";
import { completeAttempts } from "./sign-in-attempts";
import { verifyTurnstile } from "./turnstile";

export type LinkRequest = {
  mode: "login" | "signup";
  email: string;
  name?: string;
  callbackUrl: string;
  meta: RequestMeta;
  headers: Headers;
  turnstileToken?: string | null;
};

export type LinkOutcome = { kind: "sent" } | { kind: "rate_limited"; retryAt: number } | { kind: "send_failed" } | { kind: "bot" };

/**
 * Sends exactly one email for every accepted request, so the response (and its timing)
 * is the same whether or not an account exists:
 *   - account exists          -> sign-in link (older links for that email are invalidated)
 *   - sign up, no account     -> account created unverified (with consent), then sign-in link
 *   - log in, no account      -> "we couldn't find an account" email with a sign-up link
 */
export async function requestMagicLink(req: LinkRequest): Promise<LinkOutcome> {
  const email = req.email.toLowerCase();
  const limit = await checkLimits([
    ["linkByIp", req.meta.ip],
    ["linkByEmail", email],
    ["linkCooldown", email],
  ]);
  if (!limit.success) {
    await audit("rate_limited", { email, ip: req.meta.ip, userAgent: req.meta.userAgent, metadata: { action: "request_link" } });
    return { kind: "rate_limited", retryAt: limit.reset };
  }
  if (!(await verifyTurnstile(req.turnstileToken, req.meta.ip))) return { kind: "bot" };

  const db = await getDb();
  const [existing] = await db.select({ id: schema.user.id }).from(schema.user).where(eq(schema.user.email, email)).limit(1);
  let userId = existing?.id ?? null;

  try {
    if (!userId && req.mode === "signup") {
      const id = randomUUID();
      const inserted = await db
        .insert(schema.user)
        .values({ id, name: req.name ?? "", email, emailVerified: false, termsAcceptedAt: new Date(), termsVersion: env().TERMS_VERSION })
        .onConflictDoNothing({ target: schema.user.email })
        .returning({ id: schema.user.id });
      userId = inserted[0]?.id ?? (await db.select({ id: schema.user.id }).from(schema.user).where(eq(schema.user.email, email)).limit(1))[0]?.id ?? null;
    }

    if (userId) {
      await invalidatePendingLinks(db, email);
      const auth = await getAuth();
      await auth.api.signInMagicLink({ body: { email, callbackURL: req.callbackUrl || DEFAULT_AFTER_LOGIN }, headers: req.headers });
    } else {
      const signup = new URL("/signup", siteOrigin());
      await sendEmail(email, noAccountEmail({ signupUrl: signup.toString(), email }));
    }
  } catch (error) {
    await audit("email_send_failed", {
      email,
      ip: req.meta.ip,
      userAgent: req.meta.userAgent,
      metadata: { mode: req.mode, reason: error instanceof Error ? error.message.slice(0, 200) : "unknown" },
    });
    return { kind: "send_failed" };
  }

  await audit("link_requested", {
    userId,
    email,
    ip: req.meta.ip,
    userAgent: req.meta.userAgent,
    metadata: { mode: req.mode, account: userId ? "existing_or_created" : "none" },
  });
  return { kind: "sent" };
}

export type ConfirmOutcome = { kind: "ok"; userId: string; email: string } | { kind: "expired" } | { kind: "invalid" } | { kind: "rate_limited"; retryAt: number };

/** Consumes a magic-link token (single use, atomic) and creates the session cookie. */
export async function confirmMagicLink(token: string, meta: RequestMeta, headers: Headers): Promise<ConfirmOutcome> {
  const limit = await checkLimits([["confirmByIp", meta.ip]]);
  if (!limit.success) {
    await audit("rate_limited", { ip: meta.ip, userAgent: meta.userAgent, metadata: { action: "confirm" } });
    return { kind: "rate_limited", retryAt: limit.reset };
  }

  const db = await getDb();
  const state = await inspectToken(db, token);
  if (state === "expired") {
    await audit("link_expired", { ip: meta.ip, userAgent: meta.userAgent });
    return { kind: "expired" };
  }
  if (state === "missing") {
    await audit("link_invalid", { ip: meta.ip, userAgent: meta.userAgent });
    return { kind: "invalid" };
  }

  try {
    const auth = await getAuth();
    const result = await auth.api.magicLinkVerify({ query: { token }, headers });
    const user = "user" in result ? result.user : null;
    if (!user) return { kind: "invalid" };
    await completeAttempts(user.email);
    await audit("link_used", { userId: user.id, email: user.email, ip: meta.ip, userAgent: meta.userAgent });
    return { kind: "ok", userId: user.id, email: user.email };
  } catch {
    // Lost a race with another click, or it expired between the check and the use.
    await audit("link_invalid", { ip: meta.ip, userAgent: meta.userAgent, metadata: { stage: "verify" } });
    return { kind: "invalid" };
  }
}
