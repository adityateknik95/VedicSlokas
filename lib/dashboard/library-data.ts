import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { isSlokaSlug } from "@/lib/slokas";

/**
 * A student's own library: collections of slokas ("Morning chants", "For exams") and a
 * private note on any sloka. Every query is scoped by the student's id, which only ever
 * comes from their session.
 */

const { collection, collectionItem, slokaNote } = schema;

export const MAX_COLLECTIONS = 30;
export const MAX_ITEMS = 200;
export const MAX_NOTE = 2000;

export type Collection = { id: string; name: string; slugs: string[]; createdAt: string };

function isUniqueViolation(error: unknown): boolean {
  for (let e: unknown = error, i = 0; e && i < 4; i++) {
    if (typeof e === "object" && "code" in e && (e as { code: unknown }).code === "23505") return true;
    e = typeof e === "object" && "cause" in e ? (e as { cause: unknown }).cause : null;
  }
  return false;
}

/** All of a student's collections, oldest first, each with its slokas (newest first). */
export async function listCollections(userId: string): Promise<Collection[]> {
  const db = await getDb();
  const rows = await db.select().from(collection).where(eq(collection.userId, userId)).orderBy(asc(collection.createdAt));
  if (!rows.length) return [];
  const items = await db
    .select()
    .from(collectionItem)
    .where(
      inArray(
        collectionItem.collectionId,
        rows.map((r) => r.id),
      ),
    )
    .orderBy(sql`${collectionItem.addedAt} desc`);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    createdAt: r.createdAt.toISOString(),
    slugs: items.filter((i) => i.collectionId === r.id && isSlokaSlug(i.slokaSlug)).map((i) => i.slokaSlug),
  }));
}

export type CollectionResult = { ok: true; id: string } | { ok: false; reason: "limit" | "duplicate" | "not_found" };

export async function createCollection(userId: string, name: string): Promise<CollectionResult> {
  const db = await getDb();
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(collection).where(eq(collection.userId, userId));
  if (n >= MAX_COLLECTIONS) return { ok: false, reason: "limit" };
  const id = randomUUID();
  try {
    await db.insert(collection).values({ id, userId, name: name.trim() });
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, reason: "duplicate" };
    throw error;
  }
  return { ok: true, id };
}

export async function renameCollection(userId: string, id: string, name: string): Promise<CollectionResult> {
  const db = await getDb();
  try {
    const [row] = await db
      .update(collection)
      .set({ name: name.trim() })
      .where(and(eq(collection.id, id), eq(collection.userId, userId)))
      .returning({ id: collection.id });
    return row ? { ok: true, id } : { ok: false, reason: "not_found" };
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, reason: "duplicate" };
    throw error;
  }
}

/** Deleting a collection never touches favourites or notes. */
export async function deleteCollection(userId: string, id: string): Promise<CollectionResult> {
  const db = await getDb();
  const [row] = await db
    .delete(collection)
    .where(and(eq(collection.id, id), eq(collection.userId, userId)))
    .returning({ id: collection.id });
  return row ? { ok: true, id } : { ok: false, reason: "not_found" };
}

/** Idempotent: "on" twice keeps one row, "off" twice leaves none. Only the owner's collections. */
export async function setInCollection(userId: string, collectionId: string, slug: string, on: boolean): Promise<CollectionResult> {
  const db = await getDb();
  const [owned] = await db
    .select({ id: collection.id })
    .from(collection)
    .where(and(eq(collection.id, collectionId), eq(collection.userId, userId)))
    .limit(1);
  if (!owned) return { ok: false, reason: "not_found" };
  if (!on) {
    await db.delete(collectionItem).where(and(eq(collectionItem.collectionId, collectionId), eq(collectionItem.slokaSlug, slug)));
    return { ok: true, id: collectionId };
  }
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(collectionItem).where(eq(collectionItem.collectionId, collectionId));
  if (n >= MAX_ITEMS) return { ok: false, reason: "limit" };
  await db.insert(collectionItem).values({ collectionId, slokaSlug: slug }).onConflictDoNothing();
  return { ok: true, id: collectionId };
}

/* ───────── Private notes ───────── */

export async function getNote(userId: string, slug: string): Promise<{ body: string; updatedAt: string } | null> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(slokaNote)
    .where(and(eq(slokaNote.userId, userId), eq(slokaNote.slokaSlug, slug)))
    .limit(1);
  return row ? { body: row.body, updatedAt: row.updatedAt.toISOString() } : null;
}

/** Which slokas this student has notes on (for the little note marks on cards). */
export async function noteSlugs(userId: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db.select({ slug: slokaNote.slokaSlug }).from(slokaNote).where(eq(slokaNote.userId, userId));
  return rows.map((r) => r.slug);
}

/** Saves the note; an empty note is deleted. */
export async function saveNote(userId: string, slug: string, body: string, now = new Date()): Promise<{ body: string; updatedAt: string } | null> {
  const db = await getDb();
  const text = body.trim();
  if (!text) {
    await db.delete(slokaNote).where(and(eq(slokaNote.userId, userId), eq(slokaNote.slokaSlug, slug)));
    return null;
  }
  await db
    .insert(slokaNote)
    .values({ userId, slokaSlug: slug, body: text, updatedAt: now })
    .onConflictDoUpdate({ target: [slokaNote.userId, slokaNote.slokaSlug], set: { body: text, updatedAt: now } });
  return { body: text, updatedAt: now.toISOString() };
}

/** For "Download my data". */
export async function exportLibrary(userId: string) {
  const db = await getDb();
  const [collections, notes] = await Promise.all([
    listCollections(userId),
    db.select().from(slokaNote).where(eq(slokaNote.userId, userId)).orderBy(asc(slokaNote.slokaSlug)),
  ]);
  return {
    collections: collections.map((c) => ({ name: c.name, slokas: c.slugs, createdAt: c.createdAt })),
    notes: notes.map((n) => ({ sloka: n.slokaSlug, note: n.body, updatedAt: n.updatedAt.toISOString() })),
  };
}
