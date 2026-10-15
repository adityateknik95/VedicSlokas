import { z } from "zod";
import { FEATURES } from "@/db/schema";
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
