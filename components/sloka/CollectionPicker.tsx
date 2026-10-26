"use client";

import { useState } from "react";
import { Popover } from "@/components/dashboard/Popover";
import { MeError, failureMessage, meFetch } from "@/lib/dashboard/client";
import { toast } from "@/lib/toast";

type Item = { id: string; name: string; has: boolean };

const ERRORS: Record<string, string> = {
  duplicate: "You already have a collection with that name.",
  limit: "That's the most this allows. Remove something first.",
  not_found: "That collection no longer exists.",
};

/**
 * "Save to collection": tick the collections this sloka belongs in, or make a new one.
 * Each tick saves straight away (and is undone if the server refuses).
 */
export function CollectionPicker({ slug, title, initial }: { slug: string; title: string; initial: Item[] }) {
  const [items, setItems] = useState(initial);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const count = items.filter((i) => i.has).length;

  const toggle = async (item: Item) => {
    const on = !item.has;
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, has: on } : i)));
    try {
      await meFetch("/api/me/collections/items", { body: { collectionId: item.id, slug, on } });
    } catch (error) {
      setItems((list) => list.map((i) => (i.id === item.id ? { ...i, has: !on } : i)));
      toast(error instanceof MeError && ERRORS[error.code] ? ERRORS[error.code] : failureMessage(error, "update the collection"), { tone: "error" });
    }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const { id, collections } = await meFetch<{ id: string; collections: { id: string; name: string; slugs: string[] }[] }>("/api/me/collections", {
        body: { action: "create", name },
      });
      await meFetch("/api/me/collections/items", { body: { collectionId: id, slug, on: true } });
      setItems(collections.map((c) => ({ id: c.id, name: c.name, has: c.id === id || c.slugs.includes(slug) })));
      setName("");
      toast(`Saved to "${name.trim()}".`);
    } catch (error) {
      toast(error instanceof MeError && ERRORS[error.code] ? ERRORS[error.code] : failureMessage(error, "make the collection"), { tone: "error" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Popover
      label={count ? `In ${count} of your collections. Change collections for ${title}` : `Save ${title} to a collection`}
      align="left"
      panelClassName="w-72 p-3"
      buttonClassName="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-semibold text-ink transition-colors hover:border-gold aria-expanded:border-gold"
      button={
        <>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 6h10M4 12h10M4 18h6M18 15v6M15 18h6" />
          </svg>
          {count ? `In ${count} collection${count === 1 ? "" : "s"}` : "Save to collection"}
        </>
      }
    >
      {() => (
        <div>
          <p className="eyebrow px-1">Your collections</p>
          {items.length ? (
            <ul className="mt-2 max-h-64 space-y-0.5 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id}>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 text-sm text-ink hover:bg-surface-2">
                    <input type="checkbox" checked={item.has} onChange={() => void toggle(item)} className="h-4 w-4 accent-[var(--saffron)]" />
                    <span className="truncate">{item.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 px-1 text-sm text-ink-muted">Group slokas your way, like &ldquo;Morning chants&rdquo; or &ldquo;For exams&rdquo;.</p>
          )}
          <form onSubmit={(e) => void create(e)} className="mt-3 flex gap-2 border-t border-line pt-3">
            <label className="sr-only" htmlFor={`new-collection-${slug}`}>
              New collection name
            </label>
            <input
              id={`new-collection-${slug}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder="New collection"
              className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 text-sm text-ink focus:border-gold"
            />
            <button type="submit" disabled={creating || !name.trim()} className="h-11 shrink-0 rounded-xl bg-saffron px-3 text-sm font-semibold text-on-saffron disabled:opacity-50">
              {creating ? "…" : "Add"}
            </button>
          </form>
        </div>
      )}
    </Popover>
  );
}
