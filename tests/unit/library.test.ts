import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { getDb, schema } from "@/db";
import { deleteAccount, getPrefs, savePrefs } from "@/lib/dashboard/data";
import {
  createCollection,
  deleteCollection,
  exportLibrary,
  getNote,
  listCollections,
  MAX_COLLECTIONS,
  noteSlugs,
  renameCollection,
  saveNote,
  setInCollection,
} from "@/lib/dashboard/library-data";
import { collectionBody, noteBody, prefsBody } from "@/lib/dashboard/schemas";
import { slokas } from "@/lib/slokas";

/** Runs against a fresh in-memory Postgres (PGlite) with the real migrations applied. */

const [s1, s2, s3] = slokas.map((s) => s.slug);

async function makeUser() {
  const db = await getDb();
  const id = randomUUID();
  const email = `${id}@example.com`;
  await db.insert(schema.user).values({ id, name: "Asha", email });
  return { id, email };
}

beforeAll(async () => {
  await getDb();
});

describe("collections", () => {
  it("belong to one student; names are unique per student, ignoring case", async () => {
    const a = await makeUser();
    const b = await makeUser();
    const made = await createCollection(a.id, "Morning chants");
    if (!made.ok) throw new Error(made.reason);
    expect(await createCollection(a.id, "morning CHANTS")).toEqual({ ok: false, reason: "duplicate" });
    expect((await createCollection(b.id, "Morning chants")).ok).toBe(true);

    // B cannot touch A's collection in any way.
    expect(await renameCollection(b.id, made.id, "Mine")).toEqual({ ok: false, reason: "not_found" });
    expect(await setInCollection(b.id, made.id, s1, true)).toEqual({ ok: false, reason: "not_found" });
    expect(await deleteCollection(b.id, made.id)).toEqual({ ok: false, reason: "not_found" });

    await setInCollection(a.id, made.id, s1, true);
    await setInCollection(a.id, made.id, s1, true);
    await setInCollection(a.id, made.id, s2, true);
    const [mine] = await listCollections(a.id);
    expect(mine.name).toBe("Morning chants");
    expect([...mine.slugs].sort()).toEqual([s1, s2].sort());
    await setInCollection(a.id, made.id, s1, false);
    await setInCollection(a.id, made.id, s1, false);
    expect((await listCollections(a.id))[0].slugs).toEqual([s2]);

    expect((await renameCollection(a.id, made.id, "Dawn")).ok).toBe(true);
    expect((await listCollections(a.id))[0].name).toBe("Dawn");
    expect((await deleteCollection(a.id, made.id)).ok).toBe(true);
    expect(await listCollections(a.id)).toEqual([]);
  });

  it("stops at the limit", async () => {
    const u = await makeUser();
    for (let i = 0; i < MAX_COLLECTIONS; i++) expect((await createCollection(u.id, `List ${i}`)).ok).toBe(true);
    expect(await createCollection(u.id, "One too many")).toEqual({ ok: false, reason: "limit" });
  });

  it("accepts only plain, short names, and real slugs", () => {
    expect(collectionBody.safeParse({ action: "create", name: "For exams" }).success).toBe(true);
    expect(collectionBody.safeParse({ action: "create", name: "<b>x</b>" }).success).toBe(false);
    expect(collectionBody.safeParse({ action: "create", name: "x".repeat(41) }).success).toBe(false);
    expect(collectionBody.safeParse({ action: "create", name: "   " }).success).toBe(false);
    expect(noteBody.safeParse({ slug: "junk", body: "hi" }).success).toBe(false);
    expect(noteBody.safeParse({ slug: s1, body: "x".repeat(2001) }).success).toBe(false);
  });
});

describe("private notes", () => {
  it("save, update, clear by saving empty, and stay private", async () => {
    const a = await makeUser();
    const b = await makeUser();
    await saveNote(a.id, s1, "  Chant slowly at dawn.  ");
    expect((await getNote(a.id, s1))?.body).toBe("Chant slowly at dawn.");
    expect(await getNote(b.id, s1)).toBeNull();
    await saveNote(a.id, s1, "Updated");
    expect((await getNote(a.id, s1))?.body).toBe("Updated");
    expect(await noteSlugs(a.id)).toEqual([s1]);
    expect(await saveNote(a.id, s1, "   ")).toBeNull();
    expect(await getNote(a.id, s1)).toBeNull();
  });
});

describe("reading preferences", () => {
  it("store script, meaning language, goal and reminder time", async () => {
    const u = await makeUser();
    expect(await getPrefs(u.id)).toMatchObject({ script: "devanagari", meaningLang: "en", goal: null, reminderHour: null });
    const p = await savePrefs(u.id, { script: "kannada", meaningLang: "kn", goal: "recite", reminderHour: 7 });
    expect(p).toMatchObject({ script: "kannada", meaningLang: "kn", goal: "recite", reminderHour: 7 });
    expect((await savePrefs(u.id, { reminderHour: null })).reminderHour).toBeNull();
    expect(prefsBody.safeParse({ script: "klingon" }).success).toBe(false);
    expect(prefsBody.safeParse({ reminderHour: 24 }).success).toBe(false);
    expect(prefsBody.safeParse({ goal: "calm", reminderHour: 6 }).success).toBe(true);
  });
});

describe("export and delete", () => {
  it("export holds collections and notes; delete removes them", async () => {
    const db = await getDb();
    const u = await makeUser();
    const c = await createCollection(u.id, "For exams");
    if (!c.ok) throw new Error(c.reason);
    await setInCollection(u.id, c.id, s3, true);
    await saveNote(u.id, s3, "Remember the meter.");
    const data = await exportLibrary(u.id);
    expect(data.collections).toEqual([expect.objectContaining({ name: "For exams", slokas: [s3] })]);
    expect(data.notes).toEqual([expect.objectContaining({ sloka: s3, note: "Remember the meter." })]);

    await deleteAccount(u.id, u.email);
    expect(await db.select().from(schema.collection).where(eq(schema.collection.userId, u.id))).toEqual([]);
    expect(await db.select().from(schema.collectionItem).where(eq(schema.collectionItem.collectionId, c.id))).toEqual([]);
    expect(await db.select().from(schema.slokaNote).where(eq(schema.slokaNote.userId, u.id))).toEqual([]);
  });
});
