"use client";

import { ENDING_MS, JOIN_OPENS_MS, classEnd, classPhase, clockLabel, untilLabel } from "@/lib/classes-time";
import { useNow } from "./useNow";

type Props = { startsAt: string; durationMin: number; cancelled: boolean; serverNow: number; size?: "sm" | "lg" };

/** Ticks every second around class time, otherwise every half minute. */
export const tickFor = (startsAt: string, durationMin: number, now: number) => {
  const start = new Date(startsAt).getTime();
  return now >= start - JOIN_OPENS_MS - 60_000 && now < classEnd(startsAt, durationMin) ? 1000 : 30_000;
};

/**
 * Where a class stands: starts in…, live, and in its last 15 minutes a countdown to the end,
 * so the teacher and students can wrap up on time. role="timer" keeps screen readers from
 * announcing every second.
 */
export function ClassClock({ startsAt, durationMin, cancelled, serverNow, size = "sm" }: Props) {
  const now = useNow(serverNow, (t) => tickFor(startsAt, durationMin, t));
  const phase = classPhase({ startsAt, durationMin, cancelled }, now);
  const start = new Date(startsAt).getTime();
  const end = classEnd(startsAt, durationMin);
  const big = size === "lg";

  if (phase === "cancelled") return <span className="rounded-full border border-[#e0796a]/60 px-3 py-1 text-xs font-semibold text-[#f0a89c]">Cancelled</span>;
  if (phase === "ended") return <span className="text-sm text-ink-muted">Finished</span>;
  if (phase === "upcoming" || phase === "opening") {
    return (
      <span className={big ? "display text-3xl text-ink" : "text-sm text-ink-muted"}>
        Starts in {untilLabel(start - now)}
        {phase === "opening" && !big && <span className="text-accent"> · you can join now</span>}
      </span>
    );
  }
  if (phase === "live") {
    return (
      <span className={`inline-flex items-center gap-2 font-semibold text-[#9fdcb5] ${big ? "display text-3xl" : "text-sm"}`}>
        <span aria-hidden="true" className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#6fbf8e]" /> Live now
      </span>
    );
  }
  // The last 15 minutes.
  const left = end - now;
  return (
    <span role="timer" aria-label={`Class ends in ${Math.ceil(left / 60000)} minutes`} className="inline-flex flex-col">
      <span className={`font-semibold tabular-nums text-flame ${big ? "display text-6xl sm:text-7xl" : "text-base"}`}>Ends in {clockLabel(left)}</span>
      {big && (
        <span aria-hidden="true" className="mt-3 block h-1.5 w-64 max-w-full overflow-hidden rounded-full bg-surface-2">
          <span className="block h-full rounded-full bg-saffron transition-[width] duration-1000 ease-linear" style={{ width: `${(left / ENDING_MS) * 100}%` }} />
        </span>
      )}
    </span>
  );
}
