"use client";

import { useEffect } from "react";
import { LearnedToggle } from "@/components/dashboard/LearnedToggle";
import { browserTimeZone, hasSessionHint } from "@/lib/dashboard/client";
import { CollectionPicker } from "./CollectionPicker";
import { useSlokaAccount } from "./useSlokaAccount";

const VIEW_DELAY_MS = 1500;

function localDay(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * The account-aware buttons on the static sloka page. For signed-in readers, after hydration
 * it records the view (once per sloka per day, after a short read, by sendBeacon so it
 * survives navigation) and shows "Mark as learned" and "Save to collection". Guests get
 * nothing and no requests.
 */
export function SlokaAccount({ slug, title }: { slug: string; title: string }) {
  const state = useSlokaAccount(slug);

  useEffect(() => {
    if (!hasSessionHint()) return;
    const key = `vedicslokas:viewed:${slug}`;
    const timer = setTimeout(() => {
      try {
        if (localStorage.getItem(key) === localDay()) return;
        localStorage.setItem(key, localDay());
      } catch {
        // Without storage the server still counts at most once per day.
      }
      const body = JSON.stringify({ slug, tz: browserTimeZone() });
      const sent = typeof navigator.sendBeacon === "function" && navigator.sendBeacon("/api/me/progress/view", new Blob([body], { type: "application/json" }));
      if (!sent) void fetch("/api/me/progress/view", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true, credentials: "same-origin" }).catch(() => undefined);
    }, VIEW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [slug]);

  if (!state) return null;
  return (
    <>
      <LearnedToggle slug={slug} title={title} initial={Boolean(state.learnedAt)} />
      <CollectionPicker slug={slug} title={title} initial={state.collections} />
    </>
  );
}
