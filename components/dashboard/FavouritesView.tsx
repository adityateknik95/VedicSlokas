"use client";

import { useMemo, useState } from "react";
import { SlokaCard } from "@/components/library/SlokaCard";
import { EmptyState } from "@/components/dashboard/Section";
import { MeError, failureMessage, meFetch } from "@/lib/dashboard/client";
import type { Collection } from "@/lib/dashboard/library-data";
import { setFavourite, useFavorites } from "@/lib/favorites";
import { SOURCES, THEMES, slokas, themeInfo } from "@/lib/slokas";
import type { Source, Theme } from "@/lib/types";
import { toast } from "@/lib/toast";

type Sort = "recent" | "title";
const select = "h-11 rounded-full border border-line bg-bg-2 px-4 text-sm text-ink focus:border-gold";
const chip = (on: boolean) =>
  `inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors ${on ? "border-gold bg-gold/15 text-ink" : "border-line text-ink-muted hover:border-gold/60 hover:text-ink"}`;
const ERRORS: Record<string, string> = {
  duplicate: "You already have a collection with that name.",
  limit: "You have the most collections this allows. Delete one first.",
  not_found: "That collection no longer exists.",
};
const bySlug = new Map(slokas.map((s) => [s.slug, s]));

/**
 * Favourites and the student's own collections: switch between them, filter by source and
 * theme, sort, remove with undo, and rename or delete a collection.
 */
export function FavouritesView({ initialCollections, noted }: { initialCollections: Collection[]; noted: string[] }) {
  const { entries, ready } = useFavorites();
  const [collections, setCollections] = useState(initialCollections);
  const [view, setView] = useState<string>("favourites");
  const [source, setSource] = useState<Source | "">("");
  const [theme, setTheme] = useState<Theme | "">("");
  const [sort, setSort] = useState<Sort>("recent");
  const hasNote = useMemo(() => new Set(noted), [noted]);
  const current = collections.find((c) => c.id === view) ?? null;

  const list = useMemo(() => {
    const slugs = current ? current.slugs : entries.map((e) => e.slug);
    const rows = slugs.flatMap((slug) => {
      const s = bySlug.get(slug);
      return s ? [{ sloka: s }] : [];
    });
    const filtered = rows.filter((r) => (!source || r.sloka.source === source) && (!theme || r.sloka.themes.includes(theme)));
    return sort === "title" ? [...filtered].sort((x, y) => x.sloka.title.localeCompare(y.sloka.title)) : filtered;
  }, [entries, current, source, theme, sort]);

  const setSlugs = (id: string, change: (slugs: string[]) => string[]) => setCollections((cs) => cs.map((c) => (c.id === id ? { ...c, slugs: change(c.slugs) } : c)));

  const putInCollection = async (id: string, slug: string, on: boolean) => {
    setSlugs(id, (slugs) => (on ? [slug, ...slugs.filter((s) => s !== slug)] : slugs.filter((s) => s !== slug)));
    try {
      await meFetch("/api/me/collections/items", { body: { collectionId: id, slug, on } });
    } catch (error) {
      setSlugs(id, (slugs) => (on ? slugs.filter((s) => s !== slug) : [slug, ...slugs]));
      toast(error instanceof MeError && ERRORS[error.code] ? ERRORS[error.code] : failureMessage(error, "update the collection"), { tone: "error" });
    }
  };

  const remove = (slug: string, title: string) => {
    if (current) {
      const id = current.id;
      void putInCollection(id, slug, false);
      toast(`Removed ${title} from ${current.name}.`, { action: { label: "Undo", run: () => void putInCollection(id, slug, true) } });
      return;
    }
    setFavourite(slug, false);
    toast(`Removed ${title} from favourites.`, { action: { label: "Undo", run: () => setFavourite(slug, true) } });
  };

  const manage = async (body: Record<string, string>, done: string) => {
    try {
      const res = await meFetch<{ id: string; collections: Collection[] }>("/api/me/collections", { body });
      setCollections(res.collections);
      if (body.action === "create") setView(res.id);
      if (body.action === "delete") setView("favourites");
      toast(done);
    } catch (error) {
      toast(error instanceof MeError && ERRORS[error.code] ? ERRORS[error.code] : failureMessage(error, "change your collections"), { tone: "error" });
    }
  };
  const create = () => {
    const name = window.prompt("Name your collection (for example, Morning chants)")?.trim();
    if (name) void manage({ action: "create", name }, `Made "${name}". Add slokas from any sloka page with Save to collection.`);
  };
  const rename = (c: Collection) => {
    const name = window.prompt("Rename the collection", c.name)?.trim();
    if (name && name !== c.name) void manage({ action: "rename", id: c.id, name }, "Collection renamed.");
  };
  const removeCollection = (c: Collection) => {
    if (window.confirm(`Delete "${c.name}"? The slokas stay in your library and favourites.`)) void manage({ action: "delete", id: c.id }, `Deleted "${c.name}".`);
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

  if (!entries.length && !collections.length) {
    return (
      <EmptyState
        deva="पद्मम्"
        title="No favourites yet"
        body="Tap the lotus on any sloka to keep it here, or group slokas into your own collections with Save to collection. Both follow you to every device."
        cta={{ href: "/dashboard/library", label: "Explore the library" }}
      />
    );
  }

  return (
    <div>
      <div role="group" aria-label="Favourites and collections" className="mb-6 flex flex-wrap gap-2">
        <button type="button" aria-pressed={view === "favourites"} onClick={() => setView("favourites")} className={chip(view === "favourites")}>
          All favourites <span className="text-ink-muted">{entries.length}</span>
        </button>
        {collections.map((c) => (
          <button key={c.id} type="button" aria-pressed={view === c.id} onClick={() => setView(c.id)} className={chip(view === c.id)}>
            {c.name} <span className="text-ink-muted">{c.slugs.length}</span>
          </button>
        ))}
        <button type="button" onClick={create} className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-flame hover:bg-surface-2">
          + New collection
        </button>
      </div>

      {current && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <h2 className="display mr-2 text-2xl text-ink">{current.name}</h2>
          <button type="button" onClick={() => rename(current)} className="min-h-11 rounded-full border border-line px-4 text-sm text-ink hover:border-gold">
            Rename
          </button>
          <button type="button" onClick={() => removeCollection(current)} className="min-h-11 rounded-full border border-line px-4 text-sm text-ink hover:border-[#e0796a]">
            Delete collection
          </button>
        </div>
      )}

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
        Showing <strong className="text-ink">{list.length}</strong> of {current ? `${current.slugs.length} in ${current.name}` : `${entries.length} favourites`}
      </p>

      {list.length ? (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {list.map(({ sloka }, i) => (
            <li key={sloka.slug} className="relative">
              <SlokaCard sloka={sloka} index={i} />
              <div className="relative z-10 mt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => remove(sloka.slug, sloka.title)}
                  className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-ink-muted hover:bg-surface-2 hover:text-ink"
                >
                  Remove<span className="sr-only"> {sloka.title} from {current ? current.name : "favourites"}</span>
                </button>
                {hasNote.has(sloka.slug) && <span className="text-xs text-ink-muted">✎ Your note</span>}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 rounded-[1.25rem] border border-dashed border-line px-6 py-12 text-center text-ink-muted">
          {current && !current.slugs.length
            ? "Nothing here yet. Open any sloka and use Save to collection to add it."
            : current
              ? "Nothing in this collection matches these filters."
              : entries.length
                ? "No favourites match these filters."
                : "No favourites yet. Tap the lotus on any sloka to keep it here."}
        </p>
      )}
    </div>
  );
}
