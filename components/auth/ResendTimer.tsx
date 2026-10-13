"use client";

import { useActionState, useEffect, useState } from "react";
import { resendLink } from "@/app/(auth)/actions";
import { IDLE, type RequestLinkState } from "@/lib/auth-states";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";
import { formatWait, useCountdown } from "./useCountdown";

const COOLDOWN_MS = 60_000;

/** "Resend link" with a 60-second cooldown that restarts after every send. */
export function ResendTimer({ callbackUrl, sentAt }: { callbackUrl: string; sentAt: number }) {
  const [state, formAction] = useActionState<RequestLinkState, FormData>(resendLink, IDLE);
  const [until, setUntil] = useState(sentAt + COOLDOWN_MS);

  useEffect(() => {
    if (state.status === "sent") setUntil(Date.now() + COOLDOWN_MS);
    if (state.status === "rate_limited") setUntil(state.retryAt);
  }, [state]);

  const wait = useCountdown(until);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      {state.status === "sent" && <FormMessage tone="success">A fresh link is on its way. Older links no longer work.</FormMessage>}
      {state.status === "error" && <FormMessage tone="error">{state.message}</FormMessage>}
      <SubmitButton pendingLabel="Sending…" disabled={wait > 0}>
        {wait > 0 ? `Resend link in ${formatWait(wait)}` : "Resend link"}
      </SubmitButton>
    </form>
  );
}
