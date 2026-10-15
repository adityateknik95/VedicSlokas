"use client";

import { CompactSlokaCard } from "@/components/dashboard/CompactSlokaCard";
import { EmptyState, Section } from "@/components/dashboard/Section";
import type { Summary } from "@/lib/dashboard/summaries";
import { useFavorites } from "@/lib/favorites";

/** Up to six favourites, live: saving or removing anywhere updates this strip at once. */
export function FavouritesStrip({ summaries }: { summaries: Record<string, Summary> }) {
  const { entries, ready } = useFavorites();
  const list = entries.map((e) => summaries[e.slug]).filter((s): s is Summary => Boolean(s));

  return (
    <Section id="home-favourites" title="Your favourites" action={list.length ? { href: "/dashboard/favourites", label: "See all" } : undefined}>
      {!ready ? (
        <div className="no-scrollbar -mx-1 flex gap-3 overflow-hidden px-1" role="status" aria-label="Loading favourites">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} aria-hidden="true" className="skeleton h-[9.5rem] w-60 shrink-0 rounded-[1.4rem]" />
          ))}
        </div>
      ) : list.length ? (
        <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:-mx-1 sm:px-1">
          {list.slice(0, 6).map((s, i) => (
            <li key={s.slug} className="w-60 shrink-0 snap-start">
              <CompactSlokaCard sloka={s} index={i} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState deva="पद्मम्" title="No favourites yet" body="Tap the lotus on any sloka to keep it close. Your favourites follow you to every device." cta={{ href: "/dashboard/library", label: "Find one in the library" }} />
      )}
    </Section>
  );
}
