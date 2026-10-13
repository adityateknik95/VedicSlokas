"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { getAuth, SESSION_DAYS, SESSION_HINT_COOKIE } from "@/lib/auth";
import { confirmMagicLink, requestMagicLink } from "@/lib/auth-flows";
import { fieldErrorsOf, loginSchema, signupSchema } from "@/lib/auth-schemas";
import type { ConfirmState, RequestLinkState } from "@/lib/auth-states";
import { siteOrigin } from "@/lib/env";
import { requestMeta } from "@/lib/request-meta";
import { DEFAULT_AFTER_LOGIN, safeCallbackUrl } from "@/lib/redirects";
import { getSession } from "@/lib/session";
import { cancelMagicLink } from "@/lib/magic-token";
import { clearAttemptCookie, currentAttempt, startAttempt } from "@/lib/sign-in-attempts";

// Server actions are POST-only and Next.js rejects cross-origin calls (Origin vs Host),
// which is our CSRF protection here; Better Auth's own endpoints check Origin too.

const SEND_FAILED = "We couldn't send the email just now. Please try again in a moment.";
const BOT_CHECK = "We couldn't confirm you're human. Please try the check again.";

async function send(mode: "login" | "signup", email: string, name: string | undefined, callbackUrl: string, turnstileToken: string | null): Promise<RequestLinkState> {
  const outcome = await requestMagicLink({
    mode,
    email,
    name,
    callbackUrl,
    meta: await requestMeta(),
    headers: await headers(),
    turnstileToken,
  });
  switch (outcome.kind) {
    case "rate_limited":
      return { status: "rate_limited", retryAt: outcome.retryAt };
    case "bot":
      return { status: "error", message: BOT_CHECK };
    case "send_failed":
      return { status: "error", message: SEND_FAILED };
    case "sent":
      await startAttempt(email);
      return { status: "sent" };
  }
}

function checkEmailUrl(callbackUrl: string) {
  return callbackUrl === DEFAULT_AFTER_LOGIN ? "/check-email" : `/check-email?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

export async function requestLoginLink(_prev: RequestLinkState, form: FormData): Promise<RequestLinkState> {
  const parsed = loginSchema.safeParse({ email: form.get("email") });
  if (!parsed.success) return { status: "invalid", fieldErrors: fieldErrorsOf(parsed.error), values: { email: String(form.get("email") ?? "") } };
  const callbackUrl = safeCallbackUrl(form.get("callbackUrl"));
  const state = await send("login", parsed.data.email, undefined, callbackUrl, form.get("cf-turnstile-response") as string | null);
  if (state.status === "sent") redirect(checkEmailUrl(callbackUrl));
  return state;
}

export async function requestSignupLink(_prev: RequestLinkState, form: FormData): Promise<RequestLinkState> {
  const parsed = signupSchema.safeParse({ name: form.get("name"), email: form.get("email"), consent: form.get("consent") ?? undefined });
  if (!parsed.success) {
    return {
      status: "invalid",
      fieldErrors: fieldErrorsOf(parsed.error),
      values: { name: String(form.get("name") ?? ""), email: String(form.get("email") ?? "") },
    };
  }
  const callbackUrl = safeCallbackUrl(form.get("callbackUrl"));
  const state = await send("signup", parsed.data.email, parsed.data.name, callbackUrl, form.get("cf-turnstile-response") as string | null);
  if (state.status === "sent") redirect(checkEmailUrl(callbackUrl));
  return state;
}

/** "Resend" on the check-your-inbox page: same as logging in with the address we're waiting on. */
export async function resendLink(_prev: RequestLinkState, form: FormData): Promise<RequestLinkState> {
  const attempt = await currentAttempt();
  if (!attempt) return { status: "error", message: "This request has expired. Please enter your email again." };
  const callbackUrl = safeCallbackUrl(form.get("callbackUrl"));
  return send("login", attempt.email, undefined, callbackUrl, form.get("cf-turnstile-response") as string | null);
}

export async function confirmSignIn(_prev: ConfirmState, form: FormData): Promise<ConfirmState> {
  const token = String(form.get("token") ?? "");
  const next = safeCallbackUrl(form.get("next"));
  const outcome = await confirmMagicLink(token, await requestMeta(), await headers());
  switch (outcome.kind) {
    case "expired":
      return { status: "expired" };
    case "invalid":
      return { status: "invalid" };
    case "rate_limited":
      return { status: "rate_limited", retryAt: outcome.retryAt };
    case "ok": {
      (await cookies()).set(SESSION_HINT_COOKIE, "1", {
        path: "/",
        sameSite: "lax",
        secure: siteOrigin().startsWith("https://"),
        httpOnly: false,
        maxAge: 60 * 60 * 24 * SESSION_DAYS,
      });
      await clearAttemptCookie();
      redirect(next);
    }
  }
}

/** "This was not me": the recipient kills the link immediately. */
export async function cancelSignIn(form: FormData): Promise<void> {
  const token = String(form.get("token") ?? "");
  const meta = await requestMeta();
  const email = await cancelMagicLink(token);
  if (email) await audit("link_invalid", { email, ip: meta.ip, userAgent: meta.userAgent, metadata: { reason: "cancelled_by_recipient" } });
  redirect("/auth/not-me");
}

/**
 * Revokes the session server-side (the database row is deleted), then clears cookies.
 * Returns instead of redirecting so the button can tell other tabs only once it's done.
 */
export async function signOut(): Promise<void> {
  const session = await getSession();
  const auth = await getAuth();
  try {
    await auth.api.signOut({ headers: await headers() });
  } finally {
    const store = await cookies();
    store.delete(SESSION_HINT_COOKIE);
    const meta = await requestMeta();
    if (session) await audit("sign_out", { userId: session.user.id, email: session.user.email, ip: meta.ip, userAgent: meta.userAgent });
  }
}
