import "server-only";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { FEATURES, type Feature, type Goal, type MeaningLang, type ReadingScript } from "@/db/schema";
import { isSlokaSlug } from "@/lib/slokas";
import { THEMES, type Theme } from "@/lib/types";
import { mergeFavourites } from "./favourites-merge";
import { dayKey, safeTimeZone, shiftDay } from "./streak";

/*
 * Every function here takes the user id from the caller, which must have read it from the
 * validated session. Every query is scoped by that id. Slugs are checked against
 * data/slokas.json before anything is written, so junk rows can never exist.
 */

const { favourites, slokaProgress, activityDay, userPrefs, featureInterest } = schema;

/* ───────────────────────── Favourites ───────────────────────── */

export type FavouriteRow = { slug: string; createdAt: string };

export async function listFavourites(userId: string): Promise<FavouriteRow[]> {
  const db = await getDb();
  const rows = await db
    .select({ slug: favourites.slokaSlug, createdAt: favourites.createdAt })
    .from(favourites)
    .where(eq(favourites.userId, userId))
    .orderBy(desc(favourites.createdAt));
  return rows.filter((r) => isSlokaSlug(r.slug)).map((r) => ({ slug: r.slug, createdAt: r.createdAt.toISOString() }));
}

/** Idempotent: saving twice is the same as saving once. */
export async function addFavourite(userId: string, slug: string): Promise<void> {
  const db = await getDb();
  await db.insert(favourites).values({ userId, slokaSlug: slug }).onConflictDoNothing();
}

/** Idempotent: removing something that is not saved is a no-op. */
export async function removeFavourite(userId: string, slug: string): Promise<void> {
  const db = await getDb();
  await db.delete(favourites).where(and(eq(favourites.userId, userId), eq(favourites.slokaSlug, slug)));
}

/** Union of the account's favourites and a device's local ones. Safe to repeat. */
export async function mergeLocalFavourites(userId: string, local: readonly unknown[]): Promise<FavouriteRow[]> {
  const current = await listFavourites(userId);
  const { toInsert } = mergeFavourites(
    current.map((f) => f.slug),
    local,
    isSlokaSlug,
  );
  if (toInsert.length) {
    const db = await getDb();
    await db
      .insert(favourites)
      .values(toInsert.map((slug) => ({ userId, slokaSlug: slug })))
      .onConflictDoNothing();
  }
  return toInsert.length ? listFavourites(userId) : current;
}

/* ───────────────────────── Progress ───────────────────────── */

export type ProgressRow = { slug: string; firstViewedAt: string; lastViewedAt: string; viewCount: number; learnedAt: string | null };

export async function listProgress(userId: string): Promise<ProgressRow[]> {
  const db = await getDb();
  const rows = await db.select().from(slokaProgress).where(eq(slokaProgress.userId, userId)).orderBy(desc(slokaProgress.lastViewedAt));
  return rows
    .filter((r) => isSlokaSlug(r.slokaSlug))
    .map((r) => ({
      slug: r.slokaSlug,
      firstViewedAt: r.firstViewedAt.toISOString(),
      lastViewedAt: r.lastViewedAt.toISOString(),
      viewCount: r.viewCount,
      learnedAt: r.learnedAt?.toISOString() ?? null,
    }));
}

/**
 * Records that a student opened a sloka. Counts at most once per sloka per calendar day
 * in their timezone, and marks that day as active for the streak.
 * Returns true when this was the first view of the sloka today.
 */
export async function recordView(userId: string, slug: string, timeZone: string, now = new Date()): Promise<boolean> {
  const db = await getDb();
  const tz = safeTimeZone(timeZone);
  const written = await db
    .insert(slokaProgress)
    .values({ userId, slokaSlug: slug, firstViewedAt: now, lastViewedAt: now, viewCount: 1 })
    .onConflictDoUpdate({
      target: [slokaProgress.userId, slokaProgress.slokaSlug],
      set: { lastViewedAt: now, viewCount: sql`${slokaProgress.viewCount} + 1` },
      // Only when the previous view was on an earlier day, in the student's own timezone.
      setWhere: sql`(${slokaProgress.lastViewedAt} AT TIME ZONE ${tz})::date < (${now.toISOString()}::timestamptz AT TIME ZONE ${tz})::date`,
    })
    .returning({ slug: slokaProgress.slokaSlug });

  if (!written.length) return false;
  await db
    .insert(activityDay)
    .values({ userId, day: dayKey(now, tz), views: 1 })
    .onConflictDoUpdate({ target: [activityDay.userId, activityDay.day], set: { views: sql`${activityDay.views} + 1` } });
  return true;
}

/** Marks a sloka learned (or not). Learning something you never opened counts as opening it. */
export async function setLearned(userId: string, slug: string, learned: boolean, now = new Date()): Promise<string | null> {
  const db = await getDb();
  if (learned) {
    const [row] = await db
      .insert(slokaProgress)
      .values({ userId, slokaSlug: slug, firstViewedAt: now, lastViewedAt: now, viewCount: 1, learnedAt: now })
      .onConflictDoUpdate({
        target: [slokaProgress.userId, slokaProgress.slokaSlug],
        // Keep the original date if it was already learned (idempotent).
        set: { learnedAt: sql`coalesce(${slokaProgress.learnedAt}, ${now.toISOString()}::timestamptz)` },
      })
      .returning({ learnedAt: slokaProgress.learnedAt });
    return row?.learnedAt?.toISOString() ?? null;
  }
  await db
    .update(slokaProgress)
    .set({ learnedAt: null })
    .where(and(eq(slokaProgress.userId, userId), eq(slokaProgress.slokaSlug, slug)));
  return null;
}

/** Active days since `sinceDay` (inclusive), oldest first. */
export async function listActivityDays(userId: string, sinceDay: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db
    .select({ day: activityDay.day })
    .from(activityDay)
    .where(and(eq(activityDay.userId, userId), gte(activityDay.day, sinceDay)))
    .orderBy(activityDay.day);
  return rows.map((r) => r.day);
}

/* ───────────────────────── Preferences ───────────────────────── */

export type MotionPref = "system" | "reduce";
export type Prefs = {
  interests: Theme[];
  dailyEmail: boolean;
  onboardedAt: string | null;
  timezone: string | null;
  motion: MotionPref;
  script: ReadingScript;
  meaningLang: MeaningLang;
  goal: Goal | null;
  /** 0–23 in their timezone; null = no time chosen yet. */
  reminderHour: number | null;
};

export const DEFAULT_PREFS: Prefs = {
  interests: [],
  dailyEmail: false,
  onboardedAt: null,
  timezone: null,
  motion: "system",
  script: "devanagari",
  meaningLang: "en",
  goal: null,
  reminderHour: null,
};

const asThemes = (values: readonly string[]) => values.filter((v): v is Theme => (THEMES as readonly string[]).includes(v));

export async function getPrefs(userId: string): Promise<Prefs> {
  const db = await getDb();
  const [row] = await db.select().from(userPrefs).where(eq(userPrefs.userId, userId)).limit(1);
  if (!row) return { ...DEFAULT_PREFS };
  return {
    interests: asThemes(row.interests),
    dailyEmail: row.dailyEmail,
    onboardedAt: row.onboardedAt?.toISOString() ?? null,
    timezone: row.timezone,
    motion: row.motion === "reduce" ? "reduce" : "system",
    script: row.script,
    meaningLang: row.meaningLang,
    goal: row.goal,
    reminderHour: row.reminderHour,
  };
}

export type PrefsPatch = Partial<{
  interests: Theme[];
  dailyEmail: boolean;
  timezone: string;
  motion: MotionPref;
  onboarded: true;
  script: ReadingScript;
  meaningLang: MeaningLang;
  goal: Goal | null;
  reminderHour: number | null;
}>;

export async function savePrefs(userId: string, patch: PrefsPatch, now = new Date()): Promise<Prefs> {
  const db = await getDb();
  const set = {
    ...(patch.interests ? { interests: [...new Set(patch.interests)] } : {}),
    ...(patch.dailyEmail !== undefined ? { dailyEmail: patch.dailyEmail } : {}),
    ...(patch.timezone ? { timezone: safeTimeZone(patch.timezone) } : {}),
    ...(patch.motion ? { motion: patch.motion } : {}),
    ...(patch.script ? { script: patch.script } : {}),
    ...(patch.meaningLang ? { meaningLang: patch.meaningLang } : {}),
    ...(patch.goal !== undefined ? { goal: patch.goal } : {}),
    ...(patch.reminderHour !== undefined ? { reminderHour: patch.reminderHour } : {}),
    ...(patch.onboarded ? { onboardedAt: now } : {}),
    updatedAt: now,
  };
  await db
    .insert(userPrefs)
    .values({ userId, ...set })
    .onConflictDoUpdate({ target: userPrefs.userId, set });
  return getPrefs(userId);
}

/* ───────────────────────── Interest in coming-soon modules ───────────────────────── */

export const isFeature = (value: unknown): value is Feature => typeof value === "string" && (FEATURES as readonly string[]).includes(value);

export async function listInterest(userId: string): Promise<Feature[]> {
  const db = await getDb();
  const rows = await db.select({ feature: featureInterest.feature }).from(featureInterest).where(eq(featureInterest.userId, userId));
  return rows.map((r) => r.feature);
}

/** Idempotent toggle: "on" twice leaves one row, "off" twice leaves none. */
export async function setInterest(userId: string, feature: Feature, on: boolean): Promise<void> {
  const db = await getDb();
  if (on) await db.insert(featureInterest).values({ userId, feature }).onConflictDoNothing();
  else await db.delete(featureInterest).where(and(eq(featureInterest.userId, userId), eq(featureInterest.feature, feature)));
}

/* ───────────────────────── Account ───────────────────────── */

export type SignInMethod = "google" | "email-link";

export async function signInMethods(userId: string): Promise<SignInMethod[]> {
  const db = await getDb();
  const rows = await db.select({ provider: schema.account.providerId }).from(schema.account).where(eq(schema.account.userId, userId));
  const methods = new Set<SignInMethod>(rows.map((r) => (r.provider === "google" ? "google" : "email-link")));
  // Magic-link accounts have no account row of their own: an account without Google signs in by email.
  if (!methods.size) methods.add("email-link");
  return [...methods];
}

export async function updateDisplayName(userId: string, name: string): Promise<void> {
  const db = await getDb();
  await db.update(schema.user).set({ name, updatedAt: new Date() }).where(eq(schema.user.id, userId));
}

/** Every session of this user, on every device. */
export async function revokeAllSessions(userId: string): Promise<number> {
  const db = await getDb();
  const rows = await db.delete(schema.session).where(eq(schema.session.userId, userId)).returning({ id: schema.session.id });
  return rows.length;
}

export type AccountExport = {
  exportedAt: string;
  profile: { name: string; email: string; image: string | null; createdAt: string; signInMethods: SignInMethod[] };
  preferences: Prefs;
  favourites: FavouriteRow[];
  progress: ProgressRow[];
  activeDays: string[];
  featureInterest: Feature[];
};

export async function exportAccount(user: { id: string; name: string; email: string; image?: string | null; createdAt: Date }): Promise<AccountExport> {
  const [preferences, favs, progress, activeDays, interest, methods] = await Promise.all([
    getPrefs(user.id),
    listFavourites(user.id),
    listProgress(user.id),
    listActivityDays(user.id, "0000-01-01"),
    listInterest(user.id),
    signInMethods(user.id),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    profile: { name: user.name, email: user.email, image: user.image ?? null, createdAt: user.createdAt.toISOString(), signInMethods: methods },
    preferences,
    favourites: favs,
    progress,
    activeDays,
    featureInterest: interest,
  };
}

/**
 * Deletes the account. The user row cascades to sessions, sign-in accounts, favourites,
 * progress, activity, preferences and interest. Personal details in the security log and
 * pending sign-in attempts are scrubbed first, so nothing identifying is left behind.
 * Returns how many rows of each kind went, for an audit entry without personal content.
 */
export async function deleteAccount(userId: string, email: string): Promise<Record<string, number>> {
  const db = await getDb();
  const lower = email.toLowerCase();
  const count = async (table: typeof favourites | typeof slokaProgress | typeof activityDay | typeof featureInterest) =>
    (await db.select({ n: sql<number>`count(*)::int` }).from(table).where(eq(table.userId, userId)))[0]?.n ?? 0;
  const counts = {
    favourites: await count(favourites),
    progress: await count(slokaProgress),
    activeDays: await count(activityDay),
    interest: await count(featureInterest),
  };

  await db.update(schema.auditLog).set({ email: null, ip: null, userAgent: null }).where(eq(schema.auditLog.userId, userId));
  await db.update(schema.auditLog).set({ email: null, ip: null, userAgent: null }).where(eq(schema.auditLog.email, lower));
  await db.delete(schema.signInAttempt).where(eq(schema.signInAttempt.email, lower));
  await db.delete(schema.user).where(eq(schema.user.id, userId));
  return counts;
}

/* ───────────────────────── Dashboard summary ───────────────────────── */

/** Everything Home needs about this student, fetched in parallel. */
export async function loadStudentState(userId: string, weeks = 12) {
  const prefs = await getPrefs(userId);
  const tz = safeTimeZone(prefs.timezone);
  const today = dayKey(new Date(), tz);
  const [favs, progress, days, interest] = await Promise.all([
    listFavourites(userId),
    listProgress(userId),
    listActivityDays(userId, shiftDay(today, -(weeks * 7 + 400))),
    listInterest(userId),
  ]);
  return { prefs, tz, today, favourites: favs, progress, activeDays: days, interest };
}

export type StudentState = Awaited<ReturnType<typeof loadStudentState>>;

/** For the public sloka page's tiny client widget: this one sloka only. */
export async function slokaState(userId: string, slug: string): Promise<{ favourite: boolean; learnedAt: string | null }> {
  const db = await getDb();
  const [fav, prog] = await Promise.all([
    db
      .select({ slug: favourites.slokaSlug })
      .from(favourites)
      .where(and(eq(favourites.userId, userId), eq(favourites.slokaSlug, slug)))
      .limit(1),
    db
      .select({ learnedAt: slokaProgress.learnedAt })
      .from(slokaProgress)
      .where(and(eq(slokaProgress.userId, userId), eq(slokaProgress.slokaSlug, slug)))
      .limit(1),
  ]);
  return { favourite: fav.length > 0, learnedAt: prog[0]?.learnedAt?.toISOString() ?? null };
}
