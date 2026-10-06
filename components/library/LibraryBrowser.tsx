"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SOURCES, THEMES, deities, filterSlokas, slokas, themeInfo } from "@/lib/slokas";
import type { Source, Theme } from "@/lib/types";
import { useFavorites } from "@/lib/favorites";
import { SEARCH_INPUT_ID } from "@/components/layout/KeyboardShortcuts";
import { SlokaCard } from "./SlokaCard";

const chip =
  "inline-flex min-h-10 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-colors aria-pressed:border-saffron aria-pressed:bg-saffron aria-pressed:text-on-saffron";
const chipIdle = "border-line text-ink-muted hover:border-gold hover:text-ink";

export function LibraryBrowser() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const { favorites } = useFavorites();

  const source = (SOURCES as readonly string[]).includes(params.get("source") ?? "") ? (params.get("source") as Source) : "";
  const theme = (THEMES as readonly string[]).includes(params.get("theme") ?? "") ? (params.get("theme") as Theme) : "";
  const deity = deities.includes(params.get("deity") ?? "") ? params.get("deity")! : "";
  const favOnly = params.get("favorites") === "1";
  const [q, setQ] = useState(params.get("q") ?? "");

  const setParam = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("focus");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Keep the query in the URL (debounced) so searches are shareable.
  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get("q") ?? "") !== q) setParam({ q: q.trim() || null });
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    if (params.get("focus") === "search") inputRef.current?.focus();
  }, [params]);

  const results = useMemo(() => {
    const list = filterSlokas({ q, source, theme, deity });
    return favOnly ? list.filter((s) => favorites.includes(s.slug)) : list;
  }, [q, source, theme, deity, favOnly, favorites]);

  const active = Boolean(q || source || theme || deity || favOnly);

  return (
    <div>
      {/* Search */}
      <div className="relative mx-auto max-w-2xl" role="search">
        <label htmlFor={SEARCH_INPUT_ID} className="sr-only">
          Search slokas by transliteration, English, or Devanagari
        </label>
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" />
          <path d="M20 20l-4.2-4.2" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          id={SEARCH_INPUT_ID}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Try “karma”, “light” or “shiva”"
          autoComplete="off"
          spellCheck={false}
          className="h-14 w-full rounded-full border border-line bg-surface-2 pl-14 pr-14 text-base text-ink placeholder:text-ink-muted/80 focus:border-gold focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame"
        />
        <kbd aria-hidden="true" className="absolute right-5 top-1/2 hidden -translate-y-1/2 rounded border border-line px-2 py-0.5 text-xs text-ink-muted sm:block">
          /
        </kbd>
      </div>

      {/* Filters */}
      <div className="mt-8 space-y-4">
        <fieldset>
          <legend className="eyebrow mb-3">Source</legend>
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            <button type="button" aria-pressed={!source} onClick={() => setParam({ source: null })} className={`${chip} ${chipIdle}`}>
              All
            </button>
            {SOURCES.map((s) => (
              <button key={s} type="button" aria-pressed={source === s} onClick={() => setParam({ source: source === s ? null : s })} className={`${chip} ${chipIdle}`}>
                {s}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="eyebrow mb-3">Theme</legend>
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {THEMES.map((t) => (
              <button key={t} type="button" aria-pressed={theme === t} onClick={() => setParam({ theme: theme === t ? null : t })} className={`${chip} ${chipIdle}`}>
                <span className="deva mr-2 text-base leading-none" lang="sa" aria-hidden="true">
                  {themeInfo[t].devanagari}
                </span>
                {themeInfo[t].label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="deity-filter" className="eyebrow mb-3 block">
              Deity
            </label>
            <select
              id="deity-filter"
              value={deity}
              onChange={(e) => setParam({ deity: e.target.value || null })}
              className="h-11 min-w-48 rounded-full border border-line bg-bg-2 px-4 text-sm text-ink focus:border-gold"
            >
              <option value="">All deities</option>
              {deities.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <button type="button" aria-pressed={favOnly} onClick={() => setParam({ favorites: favOnly ? null : "1" })} className={`${chip} ${chipIdle} min-h-11`}>
            <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" fill={favOnly ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M12 3c2.6 2.8 3.6 6.2 0 11-3.6-4.8-2.6-8.2 0-11Z" />
              <path d="M12 14c1.2-3.6 4-6 7.5-6.5-.2 4.4-3 7-7.5 6.5ZM12 14c-1.2-3.6-4-6-7.5-6.5.2 4.4 3 7 7.5 6.5Z" />
            </svg>
            Favorites{favorites.length ? ` (${favorites.length})` : ""}
          </button>
          {active && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                router.replace(pathname, { scroll: false });
              }}
              className="min-h-11 px-2 text-sm font-medium text-flame underline-offset-4 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <p className="mt-10 text-sm text-ink-muted" aria-live="polite" aria-atomic="true">
        Showing <strong className="text-ink">{results.length}</strong> of {slokas.length} slokas
      </p>

      <h2 className="sr-only">Results</h2>
      {results.length ? (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {results.map((s, i) => (
            <li key={s.slug}>
              <SlokaCard sloka={s} index={i} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-8 rounded-[1.25rem] border border-dashed border-line px-6 py-16 text-center">
          <p className="deva text-3xl text-accent" lang="sa">
            शून्यम्
          </p>
          <p className="display mt-3 text-2xl text-ink">{favOnly && !favorites.length ? "No favorites yet" : "Nothing found"}</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
            {favOnly && !favorites.length
              ? "Tap the lotus on any sloka to keep it here. Favorites stay on this device."
              : "Try a simpler word, an English meaning, or clear a filter."}
          </p>
        </div>
      )}
    </div>
  );
}
