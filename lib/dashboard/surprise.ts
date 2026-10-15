import type { Theme } from "@/lib/types";

export type SurpriseCandidate = { slug: string; themes: readonly Theme[] };

export type SurpriseInput = {
  candidates: readonly SurpriseCandidate[];
  /** Slugs this person has ever opened. */
  viewed: ReadonlySet<string>;
  /** Most recent picks first. The last five are never repeated while there is anything else. */
  recent: readonly string[];
  /** Themes chosen during onboarding or in Settings. */
  interests: readonly Theme[];
  /** Injectable for tests; defaults to Math.random. Must return [0, 1). */
  random?: () => number;
};

/** How strongly each signal tips the scales. Gentle on purpose: every sloka stays possible. */
export const SURPRISE_WEIGHTS = {
  unseen: 4,
  perInterest: 0.75,
  avoidRecent: 5,
} as const;

/**
 * Weighted random choice for "Surprise me":
 * - prefers slokas this person has not opened yet (×4),
 * - gently favours their interests (+0.75 per matching theme),
 * - never repeats one of the last five picks while anything else is available,
 * - falls back gracefully: if everything has been seen it simply weighs by interest,
 *   and if the library is smaller than the recent window it only avoids the latest pick.
 * Returns null only when there are no candidates at all.
 */
export function pickSurprise({ candidates, viewed, recent, interests, random = Math.random }: SurpriseInput): string | null {
  if (!candidates.length) return null;

  const window = recent.slice(0, SURPRISE_WEIGHTS.avoidRecent);
  let pool = candidates.filter((c) => !window.includes(c.slug));
  if (!pool.length) pool = candidates.filter((c) => c.slug !== recent[0]);
  if (!pool.length) pool = [...candidates];

  const liked = new Set(interests);
  const weights = pool.map((c) => {
    const matches = c.themes.reduce((n, t) => n + (liked.has(t) ? 1 : 0), 0);
    return (viewed.has(c.slug) ? 1 : SURPRISE_WEIGHTS.unseen) * (1 + matches * SURPRISE_WEIGHTS.perInterest);
  });

  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.min(Math.max(random(), 0), 0.999999) * total;
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i];
    if (roll < 0) return pool[i].slug;
  }
  return pool[pool.length - 1].slug;
}
