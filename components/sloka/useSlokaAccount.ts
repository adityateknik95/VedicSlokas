"use client";

import { useEffect, useState } from "react";
import { hasSessionHint, meFetch } from "@/lib/dashboard/client";
import type { Reading } from "@/lib/reading";

export type SlokaAccountState = {
  favourite: boolean;
  learnedAt: string | null;
  collections: { id: string; name: string; has: boolean }[];
  note: { body: string; updatedAt: string } | null;
  reading: Reading | null;
};

/** One request per sloka page, shared by every account-aware part of it. */
const inflight = new Map<string, Promise<SlokaAccountState>>();

/**
 * The signed-in student's state for one sloka, or null for guests (no request at all) and
 * while loading. The public page stays static; this fills in after hydration.
 */
export function useSlokaAccount(slug: string): SlokaAccountState | null {
  const [state, setState] = useState<SlokaAccountState | null>(null);
  useEffect(() => {
    if (!hasSessionHint()) return;
    let live = true;
    let p = inflight.get(slug);
    if (!p) {
      p = meFetch<SlokaAccountState>(`/api/me/progress?slug=${encodeURIComponent(slug)}`);
      inflight.set(slug, p);
      // Fresh data on the next visit to this page.
      void p.finally(() => setTimeout(() => inflight.delete(slug), 0)).catch(() => undefined);
    }
    p.then((s) => live && setState(s)).catch(() => undefined);
    return () => {
      live = false;
    };
  }, [slug]);
  return state;
}
