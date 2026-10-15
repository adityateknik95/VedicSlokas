"use client";

import { useCallback, useSyncExternalStore } from "react";
import { failureMessage, hasSessionHint, meFetch } from "@/lib/dashboard/client";
import { toast } from "@/lib/toast";

/**
 * Favourites, with one hook for every page.
 *
 * Signed out: saved on this device (localStorage), exactly as before.
 * Signed in: saved to the account. Changes show instantly (optimistic), go to the server in
 * order, and roll back with a message if the server says no. Other open tabs follow along.
 * On sign in, favourites saved on this device are merged into the account once (union, no
 * duplicates), and the device copy is marked as merged until it changes again.
 */

const KEY = "vedicslokas:favorites";
const MERGED = "vedicslokas:favorites-merged";
const EVENT = "vedicslokas:favorites-change";
const CHANNEL = "vedicslokas-favourites";
const TAB = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Math.random());

export type FavouriteEntry = { slug: string; createdAt: string };
type Mode = "local" | "account";
type Snapshot = { mode: Mode; ready: boolean; rows: FavouriteEntry[]; slugs: string[] };

const SERVER_SNAPSHOT: Snapshot = { mode: "local", ready: false, rows: [], slugs: [] };

let snap: Snapshot | null = null;
let loading: Promise<void> | null = null;
const queues = new Map<string, Promise<void>>();

/* ───────── device copy ───────── */

function readLocal(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeLocal(next: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    localStorage.removeItem(MERGED); // the device copy changed: merge it at the next sign in
  } catch {
    // Storage unavailable (private mode): keep the in-memory copy.
  }
}

const localMerged = () => {
  try {
    return localStorage.getItem(MERGED) === "1";
  } catch {
    return true;
  }
};

/* ───────── snapshot ───────── */

function make(mode: Mode, rows: FavouriteEntry[], ready: boolean): Snapshot {
  return { mode, ready, rows, slugs: rows.map((r) => r.slug) };
}

function localSnapshot(): Snapshot {
  return make(
    "local",
    readLocal().map((slug) => ({ slug, createdAt: "" })),
    true,
  );
}

function set(next: Snapshot, broadcast = false) {
  snap = next;
  window.dispatchEvent(new Event(EVENT));
  if (broadcast && next.mode === "account") {
    try {
      const ch = new BroadcastChannel(CHANNEL);
      ch.postMessage({ from: TAB, rows: next.rows });
      ch.close();
    } catch {
      // No BroadcastChannel: other tabs catch up when they load the page again.
    }
  }
}

function getSnapshot(): Snapshot {
  if (!snap) snap = hasSessionHint() ? make("account", [], false) : localSnapshot();
  return snap;
}

/** Loads the account's favourites, merging this device's copy first when it has unmerged entries. */
function loadAccount(): Promise<void> {
  loading ??= (async () => {
    try {
      const local = readLocal();
      const res =
        local.length && !localMerged()
          ? await meFetch<{ favourites: FavouriteEntry[] }>("/api/me/favourites/merge", { body: { slugs: local } })
          : await meFetch<{ favourites: FavouriteEntry[] }>("/api/me/favourites");
      if (local.length) {
        try {
          localStorage.setItem(MERGED, "1");
        } catch {
          // Unavailable storage: the merge is idempotent, so repeating it later is harmless.
        }
      }
      if (getSnapshot().mode === "account") set(make("account", res.favourites, true), true);
    } catch {
      // Keep showing what we have; the next page load retries.
      if (getSnapshot().mode === "account") set(make("account", getSnapshot().rows, true));
    } finally {
      loading = null;
    }
  })();
  return loading;
}

/** Dashboard pages already have the rows from the server: use them, no extra request. */
export function seedFavourites(rows: FavouriteEntry[]): void {
  if (!hasSessionHint()) return;
  const current = getSnapshot();
  if (current.mode === "account" && current.ready) return;
  set(make("account", rows, true));
  if (readLocal().length && !localMerged()) void loadAccount();
}

function subscribe(cb: () => void) {
  const recheckMode = () => {
    const shouldBe: Mode = hasSessionHint() ? "account" : "local";
    if (getSnapshot().mode !== shouldBe) {
      set(shouldBe === "account" ? make("account", [], false) : localSnapshot());
      if (shouldBe === "account") void loadAccount();
    }
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY && getSnapshot().mode === "local") set(localSnapshot());
  };
  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = (e: MessageEvent<{ from: string; rows: FavouriteEntry[] }>) => {
      if (e.data.from !== TAB && getSnapshot().mode === "account") set(make("account", e.data.rows, true));
    };
  } catch {
    channel = null;
  }

  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  window.addEventListener("vs-auth-change", recheckMode);
  window.addEventListener("focus", recheckMode);
  const s = getSnapshot();
  if (s.mode === "account" && !s.ready) void loadAccount();

  return () => {
    channel?.close();
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("vs-auth-change", recheckMode);
    window.removeEventListener("focus", recheckMode);
  };
}

/* ───────── changes ───────── */

function apply(rows: FavouriteEntry[], slug: string, saved: boolean): FavouriteEntry[] {
  const without = rows.filter((r) => r.slug !== slug);
  return saved ? [{ slug, createdAt: new Date().toISOString() }, ...without] : without;
}

/** Saves or unsaves one sloka. Returns the new state. */
export function setFavourite(slug: string, saved: boolean): void {
  const current = getSnapshot();
  if (current.mode === "local") {
    const list = readLocal().filter((s) => s !== slug);
    writeLocal(saved ? [...list, slug] : list);
    set(localSnapshot());
    return;
  }

  const before = current.rows.find((r) => r.slug === slug);
  set(make("account", apply(current.rows, slug, saved), current.ready));

  // Requests for the same sloka go one after another, so rapid double taps end in the last state.
  const previous = queues.get(slug) ?? Promise.resolve();
  const run = previous.then(async () => {
    try {
      await meFetch("/api/me/favourites", { body: { slug, saved } });
      set(getSnapshot(), true);
    } catch (error) {
      // Roll back only if nothing newer replaced this change.
      const now = getSnapshot();
      if (now.mode === "account" && now.slugs.includes(slug) === saved) {
        const restored = now.rows.filter((r) => r.slug !== slug);
        set(make("account", before ? [before, ...restored] : restored, now.ready));
      }
      toast(failureMessage(error, saved ? "save that favourite" : "remove that favourite"), { tone: "error" });
    }
  });
  queues.set(slug, run);
  void run.finally(() => {
    if (queues.get(slug) === run) queues.delete(slug);
  });
}

export function useFavorites() {
  const s = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
  const toggle = useCallback((slug: string) => setFavourite(slug, !getSnapshot().slugs.includes(slug)), []);
  const has = useCallback((slug: string) => s.slugs.includes(slug), [s]);
  return { favorites: s.slugs, entries: s.rows, toggle, has, ready: s.ready, mode: s.mode };
}
