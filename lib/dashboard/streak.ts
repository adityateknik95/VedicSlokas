/**
 * Calendar days and streaks, always in the person's own timezone. A "day" is a
 * YYYY-MM-DD string so it compares and sorts as text and never shifts with the server's clock.
 */

export const DEFAULT_TIMEZONE = "UTC";

/** Returns a valid IANA timezone, or UTC when the input is missing or unknown. */
export function safeTimeZone(value: string | null | undefined): string {
  if (!value) return DEFAULT_TIMEZONE;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return value;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

/** The calendar date of `date` in `timeZone`, as YYYY-MM-DD. */
export function dayKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: safeTimeZone(timeZone), year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

const toUtc = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const fromUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** `key` moved by `delta` calendar days. */
export function shiftDay(key: string, delta: number): string {
  return fromUtc(toUtc(key) + delta * 86_400_000);
}

/** The last `n` days ending with `today`, oldest first. */
export function lastDays(today: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => shiftDay(today, i - (n - 1)));
}

export type Streak = {
  /** Consecutive active days ending today (or yesterday, if today has no activity yet). */
  current: number;
  longest: number;
  activeToday: boolean;
};

/**
 * Streak from the set of active days. Today not being active yet does not break the
 * streak: it is still alive until the day ends. No guilt, no resets mid-day.
 */
export function computeStreak(days: Iterable<string>, today: string): Streak {
  const set = new Set(days);
  const activeToday = set.has(today);

  let current = 0;
  let cursor = activeToday ? today : shiftDay(today, -1);
  while (set.has(cursor)) {
    current++;
    cursor = shiftDay(cursor, -1);
  }

  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of [...set].filter((d) => d <= today).sort()) {
    run = prev && shiftDay(prev, 1) === day ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = day;
  }

  return { current, longest: Math.max(longest, current), activeToday };
}
