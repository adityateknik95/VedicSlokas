"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { SignInStatus } from "@/app/api/sign-in-status/route";
import { AUTH_CHANNEL, type AuthMessage } from "@/lib/auth-channel";
import { FormMessage } from "./FormMessage";

/**
 * Keeps the "check your inbox" tab in step with the link:
 * - confirmed in this browser (any tab) -> go straight on
 * - confirmed on another device -> say so, and offer to sign in here too
 * Polls lightly (every 4s, slowing to 10s), pauses while the tab is hidden.
 */
export function SignInWatcher({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [elsewhere, setElsewhere] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    let stopped = false;
    let timer: number | undefined;
    const started = Date.now();
    // The attempt is marked complete a moment before the session cookie is written, so a
    // "completed but not signed in here" answer is re-checked before we say "other device".
    let completedChecks = 0;

    const check = async () => {
      if (stopped || document.hidden) return schedule();
      try {
        const res = await fetch("/api/sign-in-status", { cache: "no-store" });
        if (res.ok) {
          const status = (await res.json()) as SignInStatus;
          if (status.signedIn) {
            stopped = true;
            router.replace(callbackUrl);
            return;
          }
          if (status.attempt === "completed" || (status.attempt === "none" && completedChecks > 0)) {
            completedChecks += 1;
            if (completedChecks >= 4) {
              stopped = true;
              setElsewhere(true);
              return;
            }
            timer = window.setTimeout(check, 1500);
            return;
          }
          if (status.attempt === "expired" || status.attempt === "none") {
            stopped = true;
            setExpired(true);
            return;
          }
        }
      } catch {
        // Offline or flaky network: keep waiting quietly.
      }
      schedule();
    };
    const schedule = () => {
      if (stopped) return;
      timer = window.setTimeout(check, Date.now() - started > 120_000 ? 10_000 : 4_000);
    };

    // Another tab of this browser confirmed the link: react instantly.
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(AUTH_CHANNEL);
      channel.onmessage = (e: MessageEvent<AuthMessage>) => {
        if (e.data.type === "signed-in") void check();
      };
    } catch {
      channel = null;
    }
    const onVisible = () => {
      if (!document.hidden) void check();
    };
    document.addEventListener("visibilitychange", onVisible);
    schedule();

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      channel?.close();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router, callbackUrl]);

  if (elsewhere) {
    return (
      <FormMessage tone="success">
        <strong>You&apos;re signed in on your other device.</strong> To use VedicSlokas here too,{" "}
        <Link href="/login" className="font-semibold text-accent underline underline-offset-4">
          send a link to this device
        </Link>
        .
      </FormMessage>
    );
  }
  if (expired) {
    return (
      <FormMessage tone="info">
        This link has timed out.{" "}
        <Link href="/login" className="font-semibold text-accent underline underline-offset-4">
          Request a new one
        </Link>
        .
      </FormMessage>
    );
  }
  return (
    <p className="flex items-center gap-2 text-sm text-ink-muted" role="status">
      <span className="spinner text-accent" aria-hidden="true" />
      Waiting for you to open the link…
    </p>
  );
}
