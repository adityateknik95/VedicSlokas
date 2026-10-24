/**
 * Live class timing, shared by the server (who may join) and the browser (the clock), so the
 * two always agree. Pure functions of instants: no time zones involved.
 */

/** Join opens this long before the start. */
export const JOIN_OPENS_MS = 10 * 60 * 1000;
/** The countdown shows for this long before the end. */
export const ENDING_MS = 15 * 60 * 1000;
/** Every class is an hour long. */
export const CLASS_MINUTES = 60;

export type ClassPhase = "upcoming" | "opening" | "live" | "ending" | "ended" | "cancelled";

export function classEnd(startsAt: Date | string, durationMin: number): number {
  return new Date(startsAt).getTime() + durationMin * 60 * 1000;
}

export function classPhase(c: { startsAt: Date | string; durationMin: number; cancelled?: boolean }, now: number = Date.now()): ClassPhase {
  if (c.cancelled) return "cancelled";
  const start = new Date(c.startsAt).getTime();
  const end = classEnd(c.startsAt, c.durationMin);
  if (now >= end) return "ended";
  if (now >= end - ENDING_MS) return "ending";
  if (now >= start) return "live";
  if (now >= start - JOIN_OPENS_MS) return "opening";
  return "upcoming";
}

/** True while the Join button works: from 10 minutes before the start to the end. */
export const canJoinNow = (phase: ClassPhase) => phase === "opening" || phase === "live" || phase === "ending";

/** "1 h 05 min", "12 min", "45 s" for times until a class starts. */
export function untilLabel(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s} s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} h ${String(m % 60).padStart(2, "0")} min`;
  return `${Math.round(h / 24)} days`;
}

/** "14:59" for the closing countdown. */
export function clockLabel(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Only real meeting links: https, on Google Meet or Zoom. */
export function isMeetingUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return false;
  const host = url.hostname.toLowerCase();
  return host === "meet.google.com" || host === "zoom.us" || host.endsWith(".zoom.us");
}

/** Recordings may live anywhere common and safe to link: https only. */
export function isRecordingUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

/** "Mon, 3 Nov · 7:00 pm" in the given time zone. */
export function classWhen(startsAt: Date | string, timeZone: string): string {
  const d = new Date(startsAt);
  const day = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone }).format(d);
  const time = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone }).format(d);
  return `${day} · ${time}`;
}
