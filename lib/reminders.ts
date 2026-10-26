import "server-only";
import { and, eq, isNotNull, ne, or, isNull } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { audit } from "@/lib/audit";
import { dayKey, safeTimeZone } from "@/lib/dashboard/streak";
import { dailySlokaEmail, type EmailContent } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send";
import { env, siteOrigin } from "@/lib/env";
import { readingFor } from "@/lib/reading";
import { getSlokaOfTheDay } from "@/lib/slokas";
import { unsubscribeToken } from "@/lib/unsubscribe-token";

/**
 * Daily sloka emails, sent by an hourly job (/api/cron/reminders). A student who opted in gets
 * today's sloka at the hour they chose, in their own timezone, at most once per local day.
 */

const { user, userPrefs } = schema;

/** Why sending is off, or null when it may run. Never from Resend's shared test sender. */
export function remindersBlocked(): string | null {
  const e = env();
  if (!e.REMINDERS_ENABLED) return "REMINDERS_ENABLED is not true";
  if (!e.RESEND_API_KEY) return "RESEND_API_KEY is not set";
  if (!e.EMAIL_FROM || /@resend\.dev\b/i.test(e.EMAIL_FROM)) return "EMAIL_FROM must be an address on your own verified domain";
  return null;
}

/** The hour (0–23) and day (YYYY-MM-DD) it is now in a timezone. */
export function localClock(now: Date, timeZone: string): { hour: number; day: string } {
  const tz = safeTimeZone(timeZone);
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: tz }).format(now));
  return { hour, day: dayKey(now, tz) };
}

export type ReminderRun = { due: number; sent: number; failed: number };

/**
 * Sends today's reminders that are due this hour. Each student is claimed (their
 * last_reminder_day set to today) before sending, so two overlapping runs never send twice;
 * a failed send releases the claim so a later run can retry.
 */
export async function sendDueReminders(now = new Date(), send: (to: string, content: EmailContent) => Promise<void> = sendEmail): Promise<ReminderRun> {
  const db = await getDb();
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      timezone: userPrefs.timezone,
      hour: userPrefs.reminderHour,
      last: userPrefs.lastReminderDay,
      script: userPrefs.script,
      meaningLang: userPrefs.meaningLang,
    })
    .from(userPrefs)
    .innerJoin(user, eq(user.id, userPrefs.userId))
    .where(and(eq(userPrefs.dailyEmail, true), isNotNull(userPrefs.reminderHour)));

  const sloka = getSlokaOfTheDay(now);
  const run: ReminderRun = { due: 0, sent: 0, failed: 0 };
  for (const r of rows) {
    const { hour, day } = localClock(now, r.timezone ?? "Asia/Kolkata");
    if (hour !== r.hour || r.last === day) continue;
    run.due += 1;
    const [claimed] = await db
      .update(userPrefs)
      .set({ lastReminderDay: day })
      .where(and(eq(userPrefs.userId, r.id), or(isNull(userPrefs.lastReminderDay), ne(userPrefs.lastReminderDay, day))))
      .returning({ userId: userPrefs.userId });
    if (!claimed) continue;
    const reading = readingFor(sloka, r.script, r.meaningLang);
    try {
      await send(
        r.email,
        dailySlokaEmail({
          name: r.name,
          title: sloka.title,
          verse: reading.verse,
          meaning: reading.meaning,
          meaningIsDraft: !reading.meaningVerified && r.meaningLang !== "en",
          citation: sloka.reference.citation,
          slokaUrl: `${siteOrigin()}/sloka/${sloka.slug}`,
          unsubscribeUrl: `${siteOrigin()}/unsubscribe?u=${unsubscribeToken(r.id)}`,
        }),
      );
      run.sent += 1;
    } catch (error) {
      run.failed += 1;
      await db.update(userPrefs).set({ lastReminderDay: r.last }).where(eq(userPrefs.userId, r.id));
      await audit("email_send_failed", { userId: r.id, metadata: { kind: "daily_sloka", reason: error instanceof Error ? error.name : "unknown" } });
    }
  }
  return run;
}

/** Turns the daily email off (from an unsubscribe link). */
export async function stopDailyEmail(userId: string): Promise<void> {
  const db = await getDb();
  await db.update(userPrefs).set({ dailyEmail: false, updatedAt: new Date() }).where(eq(userPrefs.userId, userId));
}
