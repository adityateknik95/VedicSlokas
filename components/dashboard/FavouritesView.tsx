"use client";

import { useMemo, useState } from "react";
import { SlokaCard } from "@/components/library/SlokaCard";
import { EmptyState } from "@/components/dashboard/Section";
import { setFavourite, useFavorites } from "@/lib/favorites";
import { SOURCES, THEMES, slokas, themeInfo } from "@/lib/slokas";
import type { Source, Theme } from "@/lib/types";
import { toast } from "@/lib/toast";

type Sort = "recent" | "title";
const select = "h-11 rounded-full border border-line bg-bg-2 px-4 text-sm text-ink focus:border-gold";

/** All favourites: filter by source and theme, sort, remove with undo. */
export function FavouritesView() {
  const { entries, ready } = useFavorites();
  const [source, setSource] = useState<Source | "">("");
  const [theme, setTheme] = useState<Theme | "">("");
  const [sort, setSort] = useState<Sort>("recent");

  const list = useMemo(() => {
    const bySlug = new Map(slokas.map((s) => [s.slug, s]));
    const rows = entries.flatMap((e) => {
      const s = bySlug.get(e.slug);
      return s ? [{ sloka: s, createdAt: e.createdAt }] : [];
    });
    const filtered = rows.filter((r) => (!source || r.sloka.source === source) && (!theme || r.sloka.themes.includes(theme)));
    return sort === "title" ? [...filtered].sort((a, b) => a.sloka.title.localeCompare(b.sloka.title)) : filtered;
  }, [entries, source, theme, sort]);

  const remove = (slug: string, title: string) => {
    setFavourite(slug, false);
    toast(`Removed ${title} from favourites.`, { action: { label: "Undo", run: () => setFavourite(slug, true) } });
  };

  if (!ready) {
    return (
      <div role="status" aria-label="Loading favourites" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} aria-hidden="true" className="skeleton h-64 rounded-[1.25rem]" />
        ))}
      </div>
    );
  }

  if (!entries.length) {
    return <EmptyState deva="पद्मम्" title="No favourites yet" body="Tap the lotus on any sloka to keep it here. Your favourites follow you to every device." cta={{ href: "/dashboard/library", label: "Explore the library" }} />;
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="eyebrow">Source</span>
          <select value={source} onChange={(e) => setSource(e.target.value as Source | "")} className={select}>
            <option value="">All sources</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="eyebrow">Theme</span>
          <select value={theme} onChange={(e) => setTheme(e.target.value as Theme | "")} className={select}>
            <option value="">All themes</option>
            {THEMES.map((t) => (
              <option key={t} value={t}>
                {themeInfo[t].label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="eyebrow">Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={select}>
            <option value="recent">Recently added</option>
            <option value="title">Title, A to Z</option>
          </select>
        </label>
      </div>

      <p className="mt-6 text-sm text-ink-muted" aria-live="polite" aria-atomic="true">
        Showing <strong className="text-ink">{list.length}</strong> of {entries.length} favourites
      </p>

      {list.length ? (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {list.map(({ sloka }, i) => (
            <li key={sloka.slug} className="relative">
              <SlokaCard sloka={sloka} index={i} />
              <button
                type="button"
                onClick={() => remove(sloka.slug, sloka.title)}
                className="relative z-10 mt-2 inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-ink-muted hover:bg-surface-2 hover:text-ink"
              >
                Remove<span className="sr-only"> {sloka.title} from favourites</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 rounded-[1.25rem] border border-dashed border-line px-6 py-12 text-center text-ink-muted">No favourites match these filters.</p>
      )}
    </div>
  );
}
