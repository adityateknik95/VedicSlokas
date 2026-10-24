import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, gt, gte, inArray, isNull, lt, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { CLASS_MINUTES, canJoinNow, classEnd, classPhase, isMeetingUrl, isRecordingUrl } from "@/lib/classes-time";

/**
 * Live classes, held on Zoom or Google Meet. Students see the timetable; the meeting link is
 * handed out only by joinClass, around the class time, to students entitled to join.
 * Teachers manage their own classes, admins manage all.
 */

const { liveClass, classAttendance, user } = schema;
const DAY = 24 * 60 * 60 * 1000;

/** What students may see: everything except the meeting link. */
export type ClassView = {
  id: string;
  title: string;
  description: string | null;
  teacherName: string;
  startsAt: string;
  durationMin: number;
  recordingUrl: string | null;
  cancelled: boolean;
};

type Row = typeof liveClass.$inferSelect;

const view = (r: Row): ClassView => ({
  id: r.id,
  title: r.title,
  description: r.description,
  teacherName: r.teacherName,
  startsAt: r.startsAt.toISOString(),
  durationMin: r.durationMin,
  recordingUrl: r.recordingUrl,
  cancelled: r.cancelledAt !== null,
});

/** Classes whose end is after `from` and whose start is before `to`, earliest first. */
async function between(from: number, to: number): Promise<Row[]> {
  const db = await getDb();
  return db
    .select()
    .from(liveClass)
    .where(and(lt(liveClass.startsAt, new Date(to)), sql`${liveClass.startsAt} + make_interval(mins => ${liveClass.durationMin}) > ${new Date(from)}`))
    .orderBy(asc(liveClass.startsAt));
}

export type Timetable = { now: ClassView[]; upcoming: ClassView[]; past: ClassView[] };

/** Live now, the next 30 days, and the last 30 days (newest first). Cancelled past classes are left out. */
export async function timetable(now = Date.now()): Promise<Timetable> {
  const db = await getDb();
  const [current, past] = await Promise.all([
    between(now, now + 30 * DAY),
    db
      .select()
      .from(liveClass)
      .where(and(gte(liveClass.startsAt, new Date(now - 30 * DAY)), lt(liveClass.startsAt, new Date(now)), isNull(liveClass.cancelledAt)))
      .orderBy(desc(liveClass.startsAt))
      .limit(30),
  ]);
  const isNow = (r: Row) => r.startsAt.getTime() <= now && !r.cancelledAt;
  return {
    now: current.filter(isNow).map(view),
    upcoming: current.filter((r) => !isNow(r) && !(r.cancelledAt && r.startsAt.getTime() <= now)).map(view),
    past: past.filter((r) => classEnd(r.startsAt, r.durationMin) <= now).map(view),
  };
}

export async function getClass(id: string): Promise<ClassView | null> {
  const db = await getDb();
  const [row] = await db.select().from(liveClass).where(eq(liveClass.id, id)).limit(1);
  return row ? view(row) : null;
}

/** The class on now, or the next one to come (not cancelled). */
export async function nextClass(now = Date.now()): Promise<ClassView | null> {
  const rows = await between(now, now + 60 * DAY);
  const row = rows.find((r) => !r.cancelledAt);
  return row ? view(row) : null;
}

export type ClassNotice = { kind: "live" | "soon" | "new"; class: ClassView };

/** For the bell: on now, starting within a day, or scheduled in the last three days. */
export async function classNotices(now = Date.now()): Promise<ClassNotice[]> {
  const rows = (await between(now, now + 30 * DAY)).filter((r) => !r.cancelledAt);
  const notices: ClassNotice[] = [];
  for (const r of rows) {
    const start = r.startsAt.getTime();
    if (start <= now) notices.push({ kind: "live", class: view(r) });
    else if (start - now <= DAY) notices.push({ kind: "soon", class: view(r) });
    else if (now - r.createdAt.getTime() <= 3 * DAY) notices.push({ kind: "new", class: view(r) });
  }
  return notices.slice(0, 6);
}

/* ───────── Joining ───────── */

export type JoinResult = { ok: true; url: string } | { ok: false; reason: "not_found" | "not_entitled" | "cancelled" | "not_open" | "ended" };

/** The meeting link, only while the class can be joined, and only for students allowed to join. */
export async function joinClass(userId: string, classId: string, entitled: boolean, now = Date.now()): Promise<JoinResult> {
  const db = await getDb();
  const [row] = await db.select().from(liveClass).where(eq(liveClass.id, classId)).limit(1);
  if (!row) return { ok: false, reason: "not_found" };
  if (!entitled) return { ok: false, reason: "not_entitled" };
  const phase = classPhase({ startsAt: row.startsAt, durationMin: row.durationMin, cancelled: row.cancelledAt !== null }, now);
  if (phase === "cancelled") return { ok: false, reason: "cancelled" };
  if (phase === "ended") return { ok: false, reason: "ended" };
  if (!canJoinNow(phase)) return { ok: false, reason: "not_open" };
  await db.insert(classAttendance).values({ classId, userId, joinedAt: new Date(now) }).onConflictDoNothing();
  return { ok: true, url: row.meetingUrl };
}

/* ───────── Managing (teachers and admins) ───────── */

export type Actor = { id: string; name: string; role?: string | null };
export const isAdmin = (a: Actor) => a.role === "admin";
export const isTeacher = (a: Actor) => a.role === "teacher" || isAdmin(a);

/** The stored class, including its meeting details, for code that manages it. */
export async function classRow(id: string): Promise<Row | null> {
  const db = await getDb();
  const [row] = await db.select().from(liveClass).where(eq(liveClass.id, id)).limit(1);
  return row ?? null;
}

/** May this actor change this class? Teachers: their own. Admins: any. */
export const mayManage = (actor: Actor, row: Pick<Row, "teacherId">) => isAdmin(actor) || (isTeacher(actor) && row.teacherId === actor.id);

export type ManagedClass = ClassView & { meetingUrl: string; teacherId: string | null; joined: number; autoMeet: boolean };

/** Admins see every class from the last 60 days on; teachers see their own. */
export async function managedClasses(actor: Actor, now = Date.now()): Promise<ManagedClass[]> {
  if (!isTeacher(actor)) return [];
  const db = await getDb();
  const since = gte(liveClass.startsAt, new Date(now - 60 * DAY));
  const rows = await db
    .select()
    .from(liveClass)
    .where(isAdmin(actor) ? since : and(since, eq(liveClass.teacherId, actor.id)))
    .orderBy(asc(liveClass.startsAt))
    .limit(300);
  const counts = rows.length
    ? await db
        .select({ classId: classAttendance.classId, n: sql<number>`count(*)::int` })
        .from(classAttendance)
        .where(inArray(classAttendance.classId, rows.map((r) => r.id)))
        .groupBy(classAttendance.classId)
    : [];
  const joined = new Map(counts.map((c) => [c.classId, c.n]));
  return rows.map((r) => ({ ...view(r), meetingUrl: r.meetingUrl, teacherId: r.teacherId, joined: joined.get(r.id) ?? 0, autoMeet: r.googleEventId !== null }));
}

export type ClassInput = {
  id?: string;
  title: string;
  description?: string | null;
  startsAt: Date;
  meetingUrl: string;
  recordingUrl?: string | null;
  /** Admins only: the teacher's account email. Teachers always teach their own classes. */
  teacherEmail?: string | null;
  /** Set when the site created the meeting on Google Calendar; null forgets an earlier one. */
  google?: { eventId: string; ownerId: string } | null;
  /** Use this id for a new class (so a Calendar event made first can carry the same id). */
  newId?: string;
};

export type SaveResult = { ok: true; id: string } | { ok: false; reason: "forbidden" | "not_found" | "invalid_meeting_url" | "invalid_recording_url" | "unknown_teacher" };

export async function saveClass(actor: Actor, input: ClassInput, now = Date.now()): Promise<SaveResult> {
  if (!isTeacher(actor)) return { ok: false, reason: "forbidden" };
  if (!isMeetingUrl(input.meetingUrl)) return { ok: false, reason: "invalid_meeting_url" };
  if (input.recordingUrl && !isRecordingUrl(input.recordingUrl)) return { ok: false, reason: "invalid_recording_url" };
  const db = await getDb();

  let teacher = { id: actor.id, name: actor.name };
  if (input.teacherEmail && isAdmin(actor)) {
    const [t] = await db
      .select({ id: user.id, name: user.name, role: user.role })
      .from(user)
      .where(eq(user.email, input.teacherEmail.trim().toLowerCase()))
      .limit(1);
    if (!t || (t.role !== "teacher" && t.role !== "admin")) return { ok: false, reason: "unknown_teacher" };
    teacher = { id: t.id, name: t.name };
  }

  const fields = {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    startsAt: input.startsAt,
    durationMin: CLASS_MINUTES,
    meetingUrl: input.meetingUrl.trim(),
    recordingUrl: input.recordingUrl?.trim() || null,
    updatedAt: new Date(now),
  };

  const google =
    input.google === null ? { googleEventId: null, googleOwnerId: null } : input.google ? { googleEventId: input.google.eventId, googleOwnerId: input.google.ownerId } : {};
  if (!input.id) {
    const id = input.newId ?? randomUUID();
    await db.insert(liveClass).values({ id, ...fields, ...google, teacherId: teacher.id, teacherName: teacher.name, createdBy: actor.id, createdAt: new Date(now) });
    return { ok: true, id };
  }

  const [existing] = await db.select({ teacherId: liveClass.teacherId }).from(liveClass).where(eq(liveClass.id, input.id)).limit(1);
  if (!existing) return { ok: false, reason: "not_found" };
  if (!isAdmin(actor) && existing.teacherId !== actor.id) return { ok: false, reason: "forbidden" };
  const reassign = isAdmin(actor) && input.teacherEmail ? { teacherId: teacher.id, teacherName: teacher.name } : {};
  await db
    .update(liveClass)
    .set({ ...fields, ...google, ...reassign })
    .where(eq(liveClass.id, input.id));
  return { ok: true, id: input.id };
}

export type CancelResult = { ok: true } | { ok: false; reason: "forbidden" | "not_found" };

/** Cancels a class that hasn't ended. Idempotent. */
export async function cancelClass(actor: Actor, id: string, now = Date.now()): Promise<CancelResult> {
  if (!isTeacher(actor)) return { ok: false, reason: "forbidden" };
  const db = await getDb();
  const [existing] = await db.select({ teacherId: liveClass.teacherId }).from(liveClass).where(eq(liveClass.id, id)).limit(1);
  if (!existing) return { ok: false, reason: "not_found" };
  if (!isAdmin(actor) && existing.teacherId !== actor.id) return { ok: false, reason: "forbidden" };
  await db
    .update(liveClass)
    .set({ cancelledAt: new Date(now), updatedAt: new Date(now) })
    .where(and(eq(liveClass.id, id), isNull(liveClass.cancelledAt), gt(sql`${liveClass.startsAt} + make_interval(mins => ${liveClass.durationMin})`, new Date(now))));
  return { ok: true };
}
