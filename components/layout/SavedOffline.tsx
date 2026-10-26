"use client";

import { useEffect, useState } from "react";

const SAVED = "vs-saved-v1";

/** The favourite slokas this device has saved for offline reading (read from the service worker's cache). */
export function SavedOffline() {
  const [saved, setSaved] = useState<{ path: string; title: string }[] | null>(null);

  useEffect(() => {
    if (!("caches" in window)) {
      setSaved([]);
      return;
    }
    void (async () => {
      const cache = await caches.open(SAVED);
      const list = await Promise.all(
        (await cache.keys()).map(async (req) => {
          const res = await cache.match(req);
          const html = res ? await res.text() : "";
          const title = html.match(/<title>([^<]*)<\/title>/)?.[1]?.split(" · ")[0] ?? new URL(req.url).pathname;
          return { path: new URL(req.url).pathname, title };
        }),
      );
      setSaved(list.sort((a, b) => a.title.localeCompare(b.title)));
    })().catch(() => setSaved([]));
  }, []);

  if (saved === null) return null;
  if (!saved.length)
    return <p className="mt-8 rounded-2xl border border-dashed border-line p-6 text-sm text-ink-muted">No slokas saved yet. Favourite a sloka while you&apos;re online and it will be here next time.</p>;
  return (
    <div className="mt-10 text-left">
      <h2 className="eyebrow">Saved on this device</h2>
      <ul className="mt-3 divide-y divide-line rounded-2xl border border-line">
        {saved.map((s) => (
          <li key={s.path}>
            {/* A full page load, so the service worker serves the saved copy. */}
            <a href={s.path} className="flex min-h-12 items-center justify-between px-4 text-ink hover:text-accent">
              {s.title} <span aria-hidden="true">→</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
