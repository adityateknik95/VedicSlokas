"use client";

import Link from "next/link";
import { useActionState } from "react";
import { cancelSignIn, confirmSignIn } from "@/app/(auth)/actions";
import { broadcastAuth } from "@/lib/auth-channel";
import { IDLE, type ConfirmState } from "@/lib/auth-states";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";
import { formatWait, useCountdown } from "./useCountdown";

/**
 * The only thing that uses a magic-link token: a POST from this button. Link scanners
 * that prefetch the emailed URL (a GET) can't consume it.
 */
export function ConfirmForm({ token, next, email }: { token: string; next: string; email: string }) {
  const [state, formAction] = useActionState<ConfirmState, FormData>(confirmSignIn, IDLE);
  const wait = useCountdown(state.status === "rate_limited" ? state.retryAt : null);

  if (state.status === "expired" || state.status === "invalid") return <LinkProblem kind={state.status} />;

  return (
    <div className="space-y-5">
      <p className="text-ink-muted">
        Sign in as <strong className="break-all text-ink">{email}</strong>
      </p>
      <form action={formAction} onSubmit={() => broadcastAuth("signed-in")} className="space-y-4">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="next" value={next} />
        {state.status === "error" && <FormMessage tone="error">{state.message}</FormMessage>}
        {state.status === "rate_limited" && wait > 0 && (
          <FormMessage tone="info">
            Too many attempts from this network. Please wait <strong>{formatWait(wait)}</strong>.
          </FormMessage>
        )}
        <SubmitButton pendingLabel="Signing you in…" disabled={wait > 0}>
          Confirm sign in
        </SubmitButton>
      </form>
      <form action={cancelSignIn}>
        <input type="hidden" name="token" value={token} />
        <button type="submit" className="min-h-11 w-full rounded-full text-sm font-medium text-ink-muted underline-offset-4 hover:text-ink hover:underline">
          This was not me
        </button>
      </form>
    </div>
  );
}

export function LinkProblem({ kind }: { kind: "expired" | "invalid" }) {
  return (
    <div className="space-y-5">
      <FormMessage tone="info">
        {kind === "expired"
          ? "This sign-in link has expired. Links last 15 minutes, for your safety."
          : "This sign-in link has already been used, or it isn't complete. Each link works only once."}
      </FormMessage>
      <Link
        href="/login"
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-saffron px-6 font-semibold text-on-saffron shadow-[0_10px_30px_-10px_var(--glow)] transition-transform hover:-translate-y-0.5"
      >
        Send me a new link
      </Link>
    </div>
  );
}
