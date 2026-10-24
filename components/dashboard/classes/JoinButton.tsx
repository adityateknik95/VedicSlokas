"use client";

import Link from "next/link";
import { useState } from "react";
import { canJoinNow, classPhase } from "@/lib/classes-time";
import { MeError, failureMessage, meFetch } from "@/lib/dashboard/client";
import { toast } from "@/lib/toast";
import { tickFor } from "./ClassClock";
import { useNow } from "./useNow";

type Props = { classId: string; startsAt: string; durationMin: number; cancelled: boolean; entitled: boolean; serverNow: number; size?: "sm" | "lg" };

const REASONS: Record<string, string> = {
  not_open: "This class opens 10 minutes before it starts.",
  ended: "This class has finished.",
  cancelled: "This class was cancelled.",
  not_entitled: "Live classes are part of the monthly plan.",
};

/**
 * Asks the server for the meeting link (it only answers around class time, to students who may
 * join) and opens it in a new tab. The tab is opened on the click itself, so pop-up blockers
 * allow it, and then pointed at the meeting.
 */
export function JoinButton({ classId, startsAt, durationMin, cancelled, entitled, serverNow, size = "sm" }: Props) {
  const now = useNow(serverNow, (t) => tickFor(startsAt, durationMin, t));
  const phase = classPhase({ startsAt, durationMin, cancelled }, now);
  const [busy, setBusy] = useState(false);
  const big = size === "lg";

  if (phase === "ended" || phase === "cancelled") return null;
  if (!entitled) {
    return (
      <Link href="/dashboard/upgrade" className="inline-flex min-h-11 items-center rounded-full border border-gold/60 px-5 text-sm font-semibold text-ink hover:bg-gold/10">
        Included in the monthly plan
      </Link>
    );
  }

  const open = canJoinNow(phase);
  const join = async () => {
    const tab = window.open("about:blank", "_blank");
    setBusy(true);
    try {
      const { url } = await meFetch<{ url: string }>("/api/me/classes/join", { body: { classId } });
      if (tab) {
        tab.opener = null;
        tab.location.replace(url);
      } else {
        window.location.assign(url);
      }
    } catch (error) {
      tab?.close();
      toast(error instanceof MeError && REASONS[error.code] ? REASONS[error.code] : failureMessage(error, "open the class"), { tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => void join()}
        disabled={!open || busy}
        aria-describedby={open ? undefined : `join-hint-${classId}`}
        className={`inline-flex items-center gap-2 rounded-full bg-saffron font-semibold text-on-saffron transition-transform enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${big ? "min-h-14 px-8 text-base" : "min-h-11 px-5 text-sm"}`}
      >
        {busy ? "Opening…" : "Join class"} <span aria-hidden="true">↗</span>
      </button>
      {!open && (
        <span id={`join-hint-${classId}`} className="text-xs text-ink-muted">
          Opens 10 minutes before the start
        </span>
      )}
    </div>
  );
}
