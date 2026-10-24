import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { getDb, schema } from "@/db";
import { cancelClass, classNotices, getClass, joinClass, managedClasses, nextClass, saveClass, timetable, type Actor } from "@/lib/classes";
import { canJoinNow, classPhase, clockLabel, isMeetingUrl, untilLabel } from "@/lib/classes-time";
import { getEntitlements } from "@/lib/entitlements";

/** Runs against a fresh in-memory Postgres (PGlite) with the real migrations applied. */

const MIN = 60 * 1000;
const T0 = Date.parse("2026-11-02T13:30:00Z");
const MEET = "https://meet.google.com/abc-defg-hij";

async function makeUser(role: "student" | "teacher" | "admin" = "student", name = "Asha"): Promise<Actor & { email: string }> {
  const db = await getDb();
  const id = randomUUID();
  const email = `${id}@example.com`;
  await db.insert(schema.user).values({ id, name, email, role });
  return { id, name, email, role };
}

beforeAll(async () => {
  await getDb();
});

describe("class timing", () => {
  const c = { startsAt: new Date(T0), durationMin: 60 };
  it("moves through each phase at the right moment", () => {
    expect(classPhase(c, T0 - 11 * MIN)).toBe("upcoming");
    expect(classPhase(c, T0 - 10 * MIN)).toBe("opening");
    expect(classPhase(c, T0)).toBe("live");
    expect(classPhase(c, T0 + 44 * MIN + 59_000)).toBe("live");
    expect(classPhase(c, T0 + 45 * MIN)).toBe("ending");
    expect(classPhase(c, T0 + 60 * MIN - 1)).toBe("ending");
    expect(classPhase(c, T0 + 60 * MIN)).toBe("ended");
    expect(classPhase({ ...c, cancelled: true }, T0)).toBe("cancelled");
  });

  it("only lets people in from ten minutes before until the end", () => {
    expect(canJoinNow("upcoming")).toBe(false);
    expect(canJoinNow("opening")).toBe(true);
    expect(canJoinNow("ending")).toBe(true);
    expect(canJoinNow("ended")).toBe(false);
  });

  it("formats the countdowns", () => {
    expect(clockLabel(15 * MIN)).toBe("15:00");
    expect(clockLabel(59_400)).toBe("1:00");
    expect(clockLabel(-5)).toBe("0:00");
    expect(untilLabel(65 * MIN)).toBe("1 h 05 min");
    expect(untilLabel(12 * MIN)).toBe("12 min");
    expect(untilLabel(30_000)).toBe("30 s");
  });

  it("accepts only real Meet and Zoom links", () => {
    expect(isMeetingUrl(MEET)).toBe(true);
    expect(isMeetingUrl("https://us02web.zoom.us/j/123456789?pwd=x")).toBe(true);
    expect(isMeetingUrl("https://zoom.us/j/1")).toBe(true);
    expect(isMeetingUrl("http://meet.google.com/abc")).toBe(false);
    expect(isMeetingUrl("https://zoom.us.evil.com/j/1")).toBe(false);
    expect(isMeetingUrl("https://evilzoom.us/j/1")).toBe(false);
    expect(isMeetingUrl("https://user:pass@zoom.us/j/1")).toBe(false);
    expect(isMeetingUrl("javascript:alert(1)")).toBe(false);
  });
});

describe("managing classes", () => {
  it("teachers manage only their own; admins manage all and can assign a teacher", async () => {
    const t1 = await makeUser("teacher", "Guru One");
    const t2 = await makeUser("teacher", "Guru Two");
    const admin = await makeUser("admin", "Admin");
    const student = await makeUser("student");

    expect(await saveClass(student, { title: "Nope", startsAt: new Date(T0), meetingUrl: MEET }, T0)).toEqual({ ok: false, reason: "forbidden" });
    expect(await saveClass(t1, { title: "Bad link", startsAt: new Date(T0), meetingUrl: "https://example.com/x" }, T0)).toEqual({ ok: false, reason: "invalid_meeting_url" });

    const made = await saveClass(t1, { title: "Gita 2.47", startsAt: new Date(T0 + 60 * MIN), meetingUrl: MEET }, T0);
    if (!made.ok) throw new Error("save failed");
    expect((await getClass(made.id))?.teacherName).toBe("Guru One");
    expect((await getClass(made.id))?.durationMin).toBe(60);

    // Another teacher cannot edit or cancel it; the admin can.
    expect(await saveClass(t2, { id: made.id, title: "Mine now", startsAt: new Date(T0), meetingUrl: MEET }, T0)).toEqual({ ok: false, reason: "forbidden" });
    expect(await cancelClass(t2, made.id, T0)).toEqual({ ok: false, reason: "forbidden" });
    expect((await saveClass(admin, { id: made.id, title: "Gita 2.47 and 2.48", startsAt: new Date(T0 + 60 * MIN), meetingUrl: MEET, teacherEmail: t2.email }, T0)).ok).toBe(true);
    expect((await getClass(made.id))?.teacherName).toBe("Guru Two");
    expect(await saveClass(admin, { title: "X", startsAt: new Date(T0), meetingUrl: MEET, teacherEmail: student.email }, T0)).toEqual({ ok: false, reason: "unknown_teacher" });

    // Each teacher's list holds their own classes; the admin's holds everyone's.
    expect((await managedClasses(t1, T0)).some((c) => c.id === made.id)).toBe(false);
    expect((await managedClasses(t2, T0)).some((c) => c.id === made.id)).toBe(true);
    expect((await managedClasses(admin, T0)).some((c) => c.id === made.id)).toBe(true);
    expect(await managedClasses(student, T0)).toEqual([]);
  });
});

describe("joining", () => {
  it("hands out the link only in the window, only to entitled students, and counts each once", async () => {
    const db = await getDb();
    const t = await makeUser("teacher", "Guru");
    const s = await makeUser("student");
    const made = await saveClass(t, { title: "Morning chant", startsAt: new Date(T0), meetingUrl: MEET }, T0 - DAY_MS);
    if (!made.ok) throw new Error("save failed");

    expect(await joinClass(s.id, made.id, true, T0 - 20 * MIN)).toEqual({ ok: false, reason: "not_open" });
    expect(await joinClass(s.id, made.id, false, T0)).toEqual({ ok: false, reason: "not_entitled" });
    expect(await joinClass(s.id, randomUUID(), true, T0)).toEqual({ ok: false, reason: "not_found" });
    expect(await joinClass(s.id, made.id, true, T0 - 5 * MIN)).toEqual({ ok: true, url: MEET });
    expect(await joinClass(s.id, made.id, true, T0 + 50 * MIN)).toEqual({ ok: true, url: MEET });
    expect(await joinClass(s.id, made.id, true, T0 + 60 * MIN)).toEqual({ ok: false, reason: "ended" });
    const rows = await db.select().from(schema.classAttendance).where(eq(schema.classAttendance.classId, made.id));
    expect(rows).toHaveLength(1);
    expect((await managedClasses(t, T0)).find((c) => c.id === made.id)?.joined).toBe(1);

    // Cancelled before it ends: nobody gets in.
    const later = await saveClass(t, { title: "Evening chant", startsAt: new Date(T0 + 3 * 60 * MIN), meetingUrl: MEET }, T0);
    if (!later.ok) throw new Error("save failed");
    expect(await cancelClass(t, later.id, T0)).toEqual({ ok: true });
    expect(await joinClass(s.id, later.id, true, T0 + 3 * 60 * MIN)).toEqual({ ok: false, reason: "cancelled" });
  });
});

const DAY_MS = 24 * 60 * MIN;

describe("timetable and notices", () => {
  it("sorts classes into now, upcoming and past, and the bell shows what matters", async () => {
    const t = await makeUser("teacher", "Guru");
    const base = Date.parse("2027-03-10T10:00:00Z");
    const live = await saveClass(t, { title: "On now", startsAt: new Date(base - 20 * MIN), meetingUrl: MEET }, base - 5 * DAY_MS);
    const soon = await saveClass(t, { title: "In two hours", startsAt: new Date(base + 2 * 60 * MIN), meetingUrl: MEET }, base - 5 * DAY_MS);
    const past = await saveClass(t, { title: "Yesterday", startsAt: new Date(base - DAY_MS), meetingUrl: MEET, recordingUrl: "https://youtu.be/xyz" }, base - 5 * DAY_MS);
    if (!live.ok || !soon.ok || !past.ok) throw new Error("save failed");

    const tt = await timetable(base);
    expect(tt.now.map((c) => c.id)).toContain(live.id);
    expect(tt.upcoming.map((c) => c.id)).toContain(soon.id);
    expect(tt.past.find((c) => c.id === past.id)?.recordingUrl).toBe("https://youtu.be/xyz");
    expect(JSON.stringify(tt)).not.toContain("meet.google.com");

    expect((await nextClass(base))?.id).toBe(live.id);
    const notices = await classNotices(base);
    expect(notices.find((n) => n.class.id === live.id)?.kind).toBe("live");
    expect(notices.find((n) => n.class.id === soon.id)?.kind).toBe("soon");
  });
});

describe("who may join", () => {
  it("everyone while LIVE_CLASSES is everyone (the default)", async () => {
    const s = await makeUser("student");
    expect((await getEntitlements(s.id)).liveClasses).toBe(true);
    expect((await getEntitlements(s.id)).notes).toBe(false);
  });
});
