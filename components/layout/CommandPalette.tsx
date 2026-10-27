"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { SearchEntry } from "@/app/search-index.json/route";
import { trapTab } from "@/components/dashboard/focus-trap";
import { openSurprise } from "@/components/dashboard/surprise-events";
import { smoothScroller } from "@/components/motion/smooth-scroller";
import { THEME_KEY } from "@/components/ui/ThemeToggle";
import { SEARCH_INPUT_ID } from "./KeyboardShortcuts";
import { hasSessionHint } from "@/lib/dashboard/client";
import { matchesAll, normalize } from "@/lib/normalize";
import { SOURCES, THEMES } from "@/lib/types";

/** Any button can open the palette: window.dispatchEvent(new Event(PALETTE_EVENT)). */
export const PALETTE_EVENT = "vs-open-palette";
export const openPalette = () => window.dispatchEvent(new Event(PALETTE_EVENT));

const RECENT_KEY = "vedicslokas:recent";
const MAX_RECENT = 8;
const THEME_LABEL: Record<(typeof THEMES)[number], string> = { courage: "Courage", peace: "Peace", knowledge: "Knowledge", devotion: "Devotion", focus: "Focus", gratitude: "Gratitude" };

type Item = { id: string; label: string; hint: string; kind: "sloka" | "page" | "action"; run: () => void };

function readRecent(): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

let index: Promise<SearchEntry[]> | null = null;
const loadIndex = () => (index ??= fetch("/search-index.json").then((r) => (r.ok ? (r.json() as Promise<SearchEntry[]>) : [])).catch(() => ((index = null), [])));

/**
 * Ctrl/Cmd+K (or /) from anywhere: find a sloka by any spelling ("krsna", "krishna", "कृष्ण"),
 * filter by text or theme, reopen a recent one, or jump to a page. A modal dialog with
 * combobox and listbox semantics: arrows move, Enter opens, Escape closes and returns focus.
 */
export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const ids = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<string>("");
  const [theme, setTheme] = useState<string>("");
  const [entries, setEntries] = useState<SearchEntry[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [active, setActive] = useState(0);
  const [signedIn, setSignedIn] = useState(false);

  // Remember slokas the visitor opens, for "Recent".
  useEffect(() => {
    const m = pathname.match(/^\/sloka\/([a-z0-9-]+)$/);
    if (!m) return;
    try {
      const next = [m[1], ...readRecent().filter((s) => s !== m[1])].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // Without storage there is simply no Recent list.
    }
  }, [pathname]);

  const show = useCallback(() => {
    returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSignedIn(hasSessionHint());
    setRecent(readRecent());
    setQuery("");
    setActive(0);
    setOpen(true);
    void loadIndex().then(setEntries);
  }, []);

  const close = useCallback(() => dialog.current?.close(), []);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      input.current?.focus();
      // The landing page's smooth scroll would take the wheel; the list scrolls on its own while open.
      smoothScroller()?.stop();
    }
    const onClose = () => {
      smoothScroller()?.start();
      setOpen(false);
      returnTo.current?.focus?.();
    };
    d.addEventListener("close", onClose);
    return () => d.removeEventListener("close", onClose);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = Boolean(t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)));
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialog.current?.open) close();
        else show();
        return;
      }
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // On the library, "/" still jumps straight to its own search box.
        const libraryInput = document.getElementById(SEARCH_INPUT_ID) as HTMLInputElement | null;
        e.preventDefault();
        if (libraryInput) {
          libraryInput.focus();
          libraryInput.select();
        } else show();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(PALETTE_EVENT, show);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(PALETTE_EVENT, show);
    };
  }, [show, close]);

  const go = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router],
  );

  const toggleTheme = useCallback(() => {
    const next = document.documentElement.dataset.theme === "parchment" ? "night" : "parchment";
    document.documentElement.dataset.theme = next;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next === "parchment" ? "#F3E7CF" : "#0E0B1F");
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // The theme lasts for this visit.
    }
    close();
  }, [close]);

  const items = useMemo<Item[]>(() => {
    const bySlug = new Map(entries.map((e) => [e.slug, e]));
    const slokaItem = (e: SearchEntry): Item => ({ id: `s-${e.slug}`, label: e.title, hint: `${e.citation} · ${e.line}`, kind: "sloka", run: () => go(`/sloka/${e.slug}`) });
    const pages: Item[] = (
      signedIn
        ? [
            ["Home", "/dashboard"],
            ["Library", "/dashboard/library"],
            ["Favourites and collections", "/dashboard/favourites"],
            ["Progress", "/dashboard/progress"],
            ["Live classes", "/dashboard/classes"],
            ["Settings", "/dashboard/settings"],
          ]
        : [
            ["Home", "/"],
            ["Library", "/library"],
            ["About", "/about"],
            ["Read in your script", "/translate"],
            ["Log in", "/login"],
          ]
    ).map(([label, href]) => ({ id: `p-${href}`, label, hint: "Go to page", kind: "page" as const, run: () => go(href) }));
    const actions: Item[] = [
      {
        id: "a-surprise",
        label: "Surprise me",
        hint: "A verse for you",
        kind: "action",
        run: () => {
          close();
          if (signedIn && pathname.startsWith("/dashboard")) openSurprise();
          else if (entries.length) router.push(`/sloka/${entries[Math.floor(Math.random() * entries.length)].slug}`);
        },
      },
      { id: "a-theme", label: "Switch theme", hint: "Night temple or Parchment", kind: "action", run: toggleTheme },
    ];

    const filtered = entries.filter((e) => (!source || e.source === source) && (!theme || e.themes.includes(theme)));
    if (!query.trim()) {
      const rec = recent.flatMap((slug) => {
        const e = bySlug.get(slug);
        return e && filtered.includes(e) ? [slokaItem(e)] : [];
      });
      const browse = source || theme ? filtered.slice(0, 8).map(slokaItem) : [];
      return [...rec, ...browse, ...(source || theme ? [] : [...pages, ...actions])];
    }
    const slokaHits = filtered.filter((e) => matchesAll(e.hay, query));
    const lower = query.trim().toLowerCase();
    // Titles that match (by any spelling) come first.
    const q = normalize(query);
    const inTitle = (e: SearchEntry) => normalize(e.title).includes(q);
    const ranked = [...slokaHits].sort((a, b) => Number(!inTitle(a)) - Number(!inTitle(b)));
    const other = [...pages, ...actions].filter((i) => i.label.toLowerCase().includes(lower));
    return [...ranked.slice(0, 8).map(slokaItem), ...other];
  }, [entries, recent, query, source, theme, signedIn, pathname, go, close, router, toggleTheme]);

  useEffect(() => setActive(0), [query, source, theme]);

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      items[active]?.run();
    }
  };

  useEffect(() => {
    document.getElementById(`${ids}-opt-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, ids]);

  const chip = (on: boolean) => `min-h-9 rounded-full border px-3 text-xs font-medium ${on ? "border-gold bg-gold/15 text-ink" : "border-line text-ink-muted hover:text-ink"}`;
  const heading = !query.trim() && !source && !theme ? (recent.length ? "Recent, pages and actions" : "Pages and actions") : "Results";

  return (
    <dialog
      ref={dialog}
      aria-label="Search and go"
      onKeyDown={trapTab}
      data-lenis-prevent
      onClick={(e) => {
        if (e.target === dialog.current) close();
      }}
      className="m-auto mt-[12vh] w-[min(94vw,40rem)] overflow-hidden rounded-[1.5rem] border border-gold/40 bg-bg-2 p-0 text-ink backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      {open && (
        <div>
          <div className="flex items-center gap-3 border-b border-line px-5">
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-ink-muted" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="M20 20l-4.2-4.2" strokeLinecap="round" />
            </svg>
            <input
              ref={input}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKey}
              role="combobox"
              aria-expanded="true"
              aria-controls={`${ids}-list`}
              aria-activedescendant={items[active] ? `${ids}-opt-${active}` : undefined}
              aria-autocomplete="list"
              aria-label="Search slokas and pages"
              placeholder="Search slokas, any spelling, or jump to a page…"
              autoComplete="off"
              spellCheck={false}
              className="palette-input h-14 min-w-0 flex-1 bg-transparent text-base text-ink placeholder:text-ink-muted"
            />
            <kbd className="hidden rounded border border-line px-1.5 text-[0.7rem] text-ink-muted sm:block">Esc</kbd>
          </div>

          <div role="group" aria-label="Filter slokas" className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
            {SOURCES.map((s) => (
              <button key={s} type="button" aria-pressed={source === s} onClick={() => setSource(source === s ? "" : s)} className={chip(source === s)}>
                {s}
              </button>
            ))}
            <span aria-hidden="true" className="mx-1 h-6 w-px bg-line" />
            {THEMES.map((t) => (
              <button key={t} type="button" aria-pressed={theme === t} onClick={() => setTheme(theme === t ? "" : t)} className={chip(theme === t)}>
                {THEME_LABEL[t]}
              </button>
            ))}
          </div>

          <p id={`${ids}-heading`} className="px-5 pb-1 pt-4 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-ink-muted">
            {heading}
          </p>
          <ul id={`${ids}-list`} role="listbox" aria-labelledby={`${ids}-heading`} className="max-h-[min(50vh,26rem)] overflow-y-auto overscroll-contain p-2 pt-1 [scrollbar-width:thin]">
            {items.map((item, i) => (
              <li
                key={item.id}
                id={`${ids}-opt-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseMove={() => setActive(i)}
                onClick={() => item.run()}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 ${i === active ? "bg-surface-2" : ""}`}
              >
                <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line text-xs text-accent">
                  {item.kind === "sloka" ? "॥" : item.kind === "page" ? "→" : "✦"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink">{item.label}</span>
                  <span className="block truncate text-xs text-ink-muted">{item.hint}</span>
                </span>
              </li>
            ))}
            {!items.length && <li className="px-3 py-8 text-center text-sm text-ink-muted">{entries.length ? "Nothing matches. Try another spelling, or clear the filters." : "Loading…"}</li>}
          </ul>
          <p className="border-t border-line px-5 py-2.5 text-xs text-ink-muted">
            <kbd className="font-sans">↑</kbd> <kbd className="font-sans">↓</kbd> to move · <kbd className="font-sans">Enter</kbd> to open · <kbd className="font-sans">Ctrl K</kbd> anywhere
          </p>
        </div>
      )}
    </dialog>
  );
}
