import { z } from "zod";
import { FEATURES, GOALS, MEANING_LANGS, PAYMENT_MODES, READING_SCRIPTS } from "@/db/schema";
import { isSlokaSlug } from "@/lib/slokas";
import { THEMES } from "@/lib/types";
import { safeTimeZone } from "./streak";

/** Input rules for /api/me/*. Slugs must exist in data/slokas.json; everything is bounded. */

export const slugSchema = z.string().max(120).refine(isSlokaSlug, "Unknown sloka");
const timeZone = z
  .string()
  .max(64)
  .refine((tz) => safeTimeZone(tz) === tz, "Unknown timezone");

export const favouriteBody = z.object({ slug: slugSchema, saved: z.boolean() }).strict();
/** Local favourites can contain anything: unknown entries are dropped by the merge, not rejected. */
export const mergeBody = z.object({ slugs: z.array(z.string().max(120)).max(500) }).strict();
export const viewBody = z.object({ slug: slugSchema, tz: timeZone.optional() }).strict();
export const learnedBody = z.object({ slug: slugSchema, learned: z.boolean() }).strict();
export const slugQuery = z.object({ slug: slugSchema }).strict();
export const interestBody = z.object({ feature: z.enum(FEATURES), on: z.boolean() }).strict();
export const prefsBody = z
  .object({
    interests: z.array(z.enum(THEMES)).max(THEMES.length),
    dailyEmail: z.boolean(),
    timezone: timeZone,
    motion: z.enum(["system", "reduce"]),
    onboarded: z.literal(true),
    script: z.enum(READING_SCRIPTS),
    meaningLang: z.enum(MEANING_LANGS),
    goal: z.enum(GOALS).nullable(),
    reminderHour: z.number().int().min(0).max(23).nullable(),
  })
  .partial()
  .strict();
export const profileBody = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Please enter a name")
      .max(80, "Keep it under 80 characters")
      .refine((v) => !/[<>\u0000-\u001f]/.test(v), "Please use letters, spaces and simple punctuation"),
  })
  .strict();
export const deleteBody = z.object({ confirm: z.literal("DELETE") }).strict();

/** A reported manual payment. The reference is normalised and checked in lib/subscriptions. */
export const paymentBody = z.object({ mode: z.enum(PAYMENT_MODES), reference: z.string().max(60) }).strict();
export const reviewBody = z.object({ paymentId: z.uuid(), approve: z.boolean() }).strict();

/** No markup or control characters in short labels. */
const plainText = (v: string) => !/[<>\u0000-\u001f]/.test(v);

/** Joining a live class. */
export const joinBody = z.object({ classId: z.uuid() }).strict();

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => v || null);

/** Creating (no id) or editing (id) a live class. Links are checked again in lib/classes. */
export const classBody = z
  .object({
    id: z.uuid().optional(),
    title: z.string().trim().min(2).max(120).refine(plainText, "No angle brackets or control characters"),
    description: optionalText(1000),
    startsAt: z.iso.datetime({ offset: true }).transform((v) => new Date(v)),
    /** Empty: the site makes a Google Meet link (or keeps the class's current one). */
    meetingUrl: optionalText(500),
    recordingUrl: optionalText(500),
    teacherEmail: optionalText(254),
  })
  .strict();
export const cancelClassBody = z.object({ id: z.uuid() }).strict();

/** A collection's name: short, plain text. */
const collectionName = z.string().trim().min(1).max(40).refine(plainText, "Please use letters, numbers and simple punctuation");
export const collectionBody = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), name: collectionName }).strict(),
  z.object({ action: z.literal("rename"), id: z.uuid(), name: collectionName }).strict(),
  z.object({ action: z.literal("delete"), id: z.uuid() }).strict(),
]);
export const collectionItemBody = z.object({ collectionId: z.uuid(), slug: slugSchema, on: z.boolean() }).strict();
/** Notes are plain text; the page renders them as text, never as HTML. */
export const noteBody = z.object({ slug: slugSchema, body: z.string().max(2000) }).strict();
