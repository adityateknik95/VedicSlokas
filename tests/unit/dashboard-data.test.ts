import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { getDb, schema } from "@/db";
import {
  addFavourite,
  deleteAccount,
  exportAccount,
  getPrefs,
  listActivityDays,
  listFavourites,
  listInterest,
  listProgress,
  mergeLocalFavourites,
  recordView,
  removeFavourite,
  savePrefs,
  setInterest,
  setLearned,
} from "@/lib/dashboard/data";
import { slokas } from "@/lib/slokas";

/** Runs against a fresh in-memory Postgres (PGlite) with the real migrations applied. */

const [s1, s2, s3] = slokas.map((s) => s.slug);

async function makeUser(name = "Asha") {
  const db = await getDb();
  const id = randomUUID();
  const email = `${id}@example.com`;
  await db.insert(schema.user).values({ id, name, email });
  return { id, name, email, image: null, createdAt: new Date() };
}

beforeAll(async () => {
  await getDb();
});

describe("favourites", () => {
  it("are idempotent and per user", async () => {
    const asha = await makeUser("Asha");
    const ravi = await makeUser("Ravi");
    await addFavourite(asha.id, s1);
    await addFavourite(asha.id, s1);
    await addFavourite(ravi.id, s2);
    expect((await listFavourites(asha.id)).map((f) => f.slug)).toEqual([s1]);
    expect((await listFavourites(ravi.id)).map((f) => f.slug)).toEqual([s2]);
    // Ravi removing Asha's sloka changes nothing for Asha.
    await removeFavourite(ravi.id, s1);
    expect((await listFavourites(asha.id)).map((f) => f.slug)).toEqual([s1]);
    await removeFavourite(asha.id, s1);
    await removeFavourite(asha.id, s1);
    expect(await listFavourites(asha.id)).toEqual([]);
  });

  it("merge local favourites: union, junk dropped, repeatable", async () => {
    const u = await makeUser();
    await addFavourite(u.id, s1);
    const merged = await mergeLocalFavourites(u.id, [s1, s2, "junk", 3]);
    expect(merged.map((f) => f.slug).sort()).toEqual([s1, s2].sort());
    const again = await mergeLocalFavourites(u.id, [s1, s2]);
    expect(again).toHaveLength(2);
  });
});

describe("progress", () => {
  it("counts a sloka at most once per day in the student's timezone", async () => {
    const u = await makeUser();
    const t1 = new Date("2026-10-13T10:00:00Z");
    expect(await recordView(u.id, s1, "Asia/Kolkata", t1)).toBe(true);
    expect(await recordView(u.id, s1, "Asia/Kolkata", new Date("2026-10-13T12:00:00Z"))).toBe(false);
    // 19:00 UTC is already the 14th in India: a new day.
    expect(await recordView(u.id, s1, "Asia/Kolkata", new Date("2026-10-13T19:00:00Z"))).toBe(true);
    const [row] = await listProgress(u.id);
    expect(row.viewCount).toBe(2);
    expect(await listActivityDays(u.id, "2026-01-01")).toEqual(["2026-10-13", "2026-10-14"]);
  });

  it("learned is idempotent, keeps the first date, and can be undone", async () => {
    const u = await makeUser();
    const first = await setLearned(u.id, s2, true, new Date("2026-10-01T00:00:00Z"));
    const second = await setLearned(u.id, s2, true, new Date("2026-10-05T00:00:00Z"));
    expect(second).toBe(first);
    expect(await setLearned(u.id, s2, false)).toBeNull();
    expect((await listProgress(u.id))[0].learnedAt).toBeNull();
  });
});

describe("preferences and interest", () => {
  it("default, then partial updates", async () => {
    const u = await makeUser();
    expect((await getPrefs(u.id)).onboardedAt).toBeNull();
    await savePrefs(u.id, { interests: ["peace", "peace", "focus"], timezone: "Asia/Kolkata" });
    const p = await savePrefs(u.id, { dailyEmail: true, onboarded: true });
    expect(p.interests).toEqual(["peace", "focus"]);
    expect(p.timezone).toBe("Asia/Kolkata");
    expect(p.dailyEmail).toBe(true);
    expect(p.onboardedAt).not.toBeNull();
  });

  it("interest toggles are idempotent", async () => {
    const u = await makeUser();
    await setInterest(u.id, "notes", true);
    await setInterest(u.id, "notes", true);
    expect(await listInterest(u.id)).toEqual(["notes"]);
    await setInterest(u.id, "notes", false);
    await setInterest(u.id, "notes", false);
    expect(await listInterest(u.id)).toEqual([]);
  });
});

describe("export and delete", () => {
  it("export contains only this student's data", async () => {
    const me = await makeUser("Me");
    const other = await makeUser("Other");
    await addFavourite(me.id, s1);
    await addFavourite(other.id, s3);
    await recordView(other.id, s3, "UTC");
    const data = await exportAccount(me);
    expect(data.profile.email).toBe(me.email);
    expect(data.favourites.map((f) => f.slug)).toEqual([s1]);
    expect(data.progress).toEqual([]);
    expect(JSON.stringify(data)).not.toContain(other.email);
  });

  it("delete removes every row of the student and scrubs the security log", async () => {
    const db = await getDb();
    const u = await makeUser();
    const keep = await makeUser("Keep");
    await addFavourite(u.id, s1);
    await recordView(u.id, s1, "UTC");
    await setLearned(u.id, s2, true);
    await savePrefs(u.id, { interests: ["peace"] });
    await setInterest(u.id, "courses", true);
    await addFavourite(keep.id, s1);
    await db.insert(schema.session).values({ id: randomUUID(), token: randomUUID(), userId: u.id, expiresAt: new Date(Date.now() + 86_400_000) });
    await db.insert(schema.auditLog).values({ id: randomUUID(), event: "sign_out", userId: u.id, email: u.email, ip: "1.2.3.4" });

    const counts = await deleteAccount(u.id, u.email);
    expect(counts).toEqual({ favourites: 1, progress: 2, activeDays: 1, interest: 1 });

    for (const table of [schema.favourites, schema.slokaProgress, schema.activityDay, schema.featureInterest, schema.session]) {
      expect(await db.select().from(table).where(eq(table.userId, u.id))).toEqual([]);
    }
    expect(await db.select().from(schema.userPrefs).where(eq(schema.userPrefs.userId, u.id))).toEqual([]);
    expect(await db.select().from(schema.user).where(eq(schema.user.id, u.id))).toEqual([]);
    const logs = await db.select().from(schema.auditLog).where(eq(schema.auditLog.event, "sign_out"));
    expect(logs.some((l) => l.email === u.email || l.ip === "1.2.3.4")).toBe(false);
    // Nobody else is touched.
    expect((await listFavourites(keep.id)).map((f) => f.slug)).toEqual([s1]);
  });
});
