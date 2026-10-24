"use client";

import Link from "next/link";
import type { ClassNotice } from "@/lib/classes";
import { classEnd, classPhase, clockLabel } from "@/lib/classes-time";
import { tickFor } from "./ClassClock";
import { useNow } from "./useNow";

const KIND: Record<ClassNotice["kind"], string> = { live: "Live now", soon: "Starting soon", new: "New class" };
const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** The bell's list: classes on now, starting within a day, or newly scheduled. */
export function ClassNoticesList({ notices, onPick }: { notices: ClassNotice[]; onPick: () => void }) {
  return (
    <div>
      <p className="eyebrow px-1">Live classes</p>
      <ul className="mt-2 space-y-1">
        {notices.map((n) => (
          <li key={n.class.id}>
            <Link href={`/dashboard/classes/${n.class.id}`} onClick={onPick} className="block rounded-xl px-3 py-2.5 hover:bg-surface-2">
              <span className={`text-[0.65rem] font-semibold uppercase tracking-[0.18em] ${n.kind === "live" ? "text-[#9fdcb5]" : "text-flame"}`}>{KIND[n.kind]}</span>
              <span className="mt-0.5 block font-semibold text-ink">{n.class.title}</span>
              <span className="block text-xs text-ink-muted">
                {when(n.class.startsAt)} · {n.class.teacherName}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/dashboard/classes" onClick={onPick} className="mt-2 flex min-h-11 items-center justify-center rounded-xl text-sm font-semibold text-flame hover:bg-surface-2">
        All classes
      </Link>
    </div>
  );
}

/**
 * In the top bar while a class is on: "Live: <title>", then in its last 15 minutes the
 * countdown, so nobody needs the class page open to see the time left.
 */
export function LiveClassPill({ notice, serverNow }: { notice: ClassNotice; serverNow: number }) {
  const c = notice.class;
  const now = useNow(serverNow, (t) => tickFor(c.startsAt, c.durationMin, t));
  const phase = classPhase({ startsAt: c.startsAt, durationMin: c.durationMin, cancelled: c.cancelled }, now);
  if (phase !== "live" && phase !== "ending") return null;
  return (
    <Link
      href={`/dashboard/classes/${c.id}`}
      className="hidden min-h-11 max-w-64 items-center gap-2 rounded-full border border-[#6fbf8e]/50 bg-[#6fbf8e]/10 px-4 text-sm font-semibold text-ink hover:bg-[#6fbf8e]/20 lg:inline-flex"
    >
      <span aria-hidden="true" className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#6fbf8e]" />
      {phase === "ending" ? (
        <span className="tabular-nums text-flame">Ends in {clockLabel(classEnd(c.startsAt, c.durationMin) - now)}</span>
      ) : (
        <span className="truncate">Live: {c.title}</span>
      )}
    </Link>
  );
}
