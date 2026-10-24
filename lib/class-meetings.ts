import "server-only";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { cancelClass, classRow, isTeacher, mayManage, saveClass, type Actor, type CancelResult, type ClassInput, type SaveResult } from "@/lib/classes";
import { classEnd } from "@/lib/classes-time";
import { accessToken, createMeetEvent, deleteEvent, GoogleError, revoke, updateEvent, type EventInput, type Fetch } from "@/lib/google-calendar";
import { open, seal } from "@/lib/secret-box";

/**
 * Scheduling with automatic Google Meet links. A teacher connects their Google account once;
 * then a class saved without a link gets a Calendar event (one hour) with a new Meet link on
 * that account, so the teacher owns the meeting and admits students. Edits and cancellations
 * follow on the same calendar.
 */

const { googleCalendarLink, user } = schema;
const PURPOSE = "google-refresh-token";

/* ───────── The teacher's Google connection ───────── */

export async function googleLinkFor(userId: string): Promise<{ email: string } | null> {
  const db = await getDb();
  const [row] = await db.select({ email: googleCalendarLink.googleEmail }).from(googleCalendarLink).where(eq(googleCalendarLink.userId, userId)).limit(1);
  return row ?? null;
}

export async function saveGoogleLink(userId: string, email: string, refreshToken: string): Promise<void> {
  const db = await getDb();
  const values = { userId, googleEmail: email, refreshToken: seal(refreshToken, PURPOSE), connectedAt: new Date() };
  await db.insert(googleCalendarLink).values(values).onConflictDoUpdate({ target: googleCalendarLink.userId, set: values });
}

export async function removeGoogleLink(userId: string, f: Fetch = fetch): Promise<void> {
  const db = await getDb();
  const [row] = await db.delete(googleCalendarLink).where(eq(googleCalendarLink.userId, userId)).returning();
  const token = row ? open(row.refreshToken, PURPOSE) : null;
  if (token) await revoke(token, f);
}

/** A fresh access token for this teacher's calendar. A revoked grant disconnects them. */
async function tokenFor(userId: string, f: Fetch): Promise<string> {
  const db = await getDb();
  const [row] = await db.select().from(googleCalendarLink).where(eq(googleCalendarLink.userId, userId)).limit(1);
  const refresh = row ? open(row.refreshToken, PURPOSE) : null;
  if (!refresh) throw new GoogleError("revoked", "Google is not connected");
  try {
    return await accessToken(refresh, f);
  } catch (error) {
    if (error instanceof GoogleError && error.code === "revoked") await db.delete(googleCalendarLink).where(eq(googleCalendarLink.userId, userId));
    throw error;
  }
}

/* ───────── Scheduling ───────── */

export type ScheduleResult = SaveResult | { ok: false; reason: "google_not_connected" | "google_failed" };

const eventFor = (input: ClassInput, durationMin: number, guests: string[]): EventInput => ({
  title: input.title.trim(),
  description: input.description,
  start: input.startsAt,
  end: new Date(classEnd(input.startsAt, durationMin)),
  guests,
});

/** The teacher as a guest when an admin schedules for them, so it lands in their calendar too. */
async function guestsFor(teacherEmail: string | null | undefined): Promise<string[]> {
  if (!teacherEmail) return [];
  const db = await getDb();
  const [t] = await db.select({ email: user.email }).from(user).where(eq(user.email, teacherEmail.trim().toLowerCase())).limit(1);
  return t ? [t.email] : [];
}

/**
 * Saves a class. With a link: as given. Without one: creates (or, for a class made that way,
 * updates) the Google Calendar event and its Meet link first, then saves; a new event is
 * removed again if the save is refused.
 */
export async function scheduleClass(actor: Actor, input: Omit<ClassInput, "meetingUrl"> & { meetingUrl?: string | null }, f: Fetch = fetch): Promise<ScheduleResult> {
  if (!isTeacher(actor)) return { ok: false, reason: "forbidden" };
  const existing = input.id ? await classRow(input.id) : null;
  if (input.id && !existing) return { ok: false, reason: "not_found" };
  if (existing && !mayManage(actor, existing)) return { ok: false, reason: "forbidden" };

  // A link was typed in: use it as is, and retire any event the site made for this class.
  if (input.meetingUrl) {
    const saved = await saveClass(actor, { ...input, meetingUrl: input.meetingUrl, google: existing?.googleEventId ? null : undefined });
    if (saved.ok && existing?.googleEventId && existing.googleOwnerId) {
      await tokenFor(existing.googleOwnerId, f)
        .then((token) => deleteEvent(token, existing.googleEventId as string, f))
        .catch(() => undefined);
    }
    return saved;
  }

  // Editing a class whose meeting the site made: move the same event.
  if (existing?.googleEventId && existing.googleOwnerId) {
    try {
      const token = await tokenFor(existing.googleOwnerId, f);
      await updateEvent(token, existing.googleEventId, eventFor(input as ClassInput, existing.durationMin, await guestsFor(input.teacherEmail)), f);
    } catch (error) {
      if (!(error instanceof GoogleError)) throw error;
      return { ok: false, reason: error.code === "revoked" ? "google_not_connected" : "google_failed" };
    }
    return saveClass(actor, { ...input, meetingUrl: existing.meetingUrl, google: { eventId: existing.googleEventId, ownerId: existing.googleOwnerId } });
  }
  if (existing) return saveClass(actor, { ...input, meetingUrl: existing.meetingUrl });

  // A new class: make the meeting on the scheduler's Google account.
  if (!(await googleLinkFor(actor.id))) return { ok: false, reason: "google_not_connected" };
  const newId = randomUUID();
  let created: { eventId: string; meetUrl: string };
  let token: string;
  try {
    token = await tokenFor(actor.id, f);
    created = await createMeetEvent(token, newId, eventFor(input as ClassInput, 60, await guestsFor(input.teacherEmail)), f);
  } catch (error) {
    if (!(error instanceof GoogleError)) throw error;
    return { ok: false, reason: error.code === "revoked" ? "google_not_connected" : "google_failed" };
  }
  const saved = await saveClass(actor, { ...input, newId, meetingUrl: created.meetUrl, google: { eventId: created.eventId, ownerId: actor.id } }).catch((error: unknown) => {
    void deleteEvent(token, created.eventId, f).catch(() => undefined);
    throw error;
  });
  if (!saved.ok) await deleteEvent(token, created.eventId, f).catch(() => undefined);
  return saved;
}

/** Cancels the class, then deletes its Calendar event (best effort: the class is cancelled either way). */
export async function cancelScheduledClass(actor: Actor, id: string, f: Fetch = fetch): Promise<CancelResult> {
  const row = await classRow(id);
  const result = await cancelClass(actor, id);
  if (result.ok && row?.googleEventId && row.googleOwnerId) {
    try {
      await deleteEvent(await tokenFor(row.googleOwnerId, f), row.googleEventId, f);
    } catch {
      // The teacher can delete it from their calendar; students can no longer join anyway.
    }
  }
  return result;
}
