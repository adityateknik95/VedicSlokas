import { slokas } from "@/lib/slokas";
import type { Sloka } from "@/lib/types";

/** The few fields small cards need, so client components never ship the whole library. */
export function summarise(s: Sloka) {
  return {
    slug: s.slug,
    title: s.title,
    source: s.source,
    themes: s.themes,
    firstLine: s.devanagari.split("\n")[0].replace(/[।॥]/g, "").trim(),
    citation: s.reference.citation,
  };
}

export type Summary = ReturnType<typeof summarise>;

export const allSummaries = (): Record<string, Summary> => Object.fromEntries(slokas.map((s) => [s.slug, summarise(s)]));
