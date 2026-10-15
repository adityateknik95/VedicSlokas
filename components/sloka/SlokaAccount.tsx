"use client";

import { useEffect, useState } from "react";
import { LearnedToggle } from "@/components/dashboard/LearnedToggle";
import { browserTimeZone, hasSessionHint, meFetch } from "@/lib/dashboard/client";

const VIEW_DELAY_MS = 1500;

function localDay(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * The only account-aware part of the static sloka page. For signed-in readers, after
 * hydration it records the view (once per sloka per day, after a short read, by sendBeacon
 * so it survives navigation) and shows "Mark as learned". Guests get nothing and no requests.
 */
export function SlokaAccount({ slug, title }: { slug: string; title: string }) {
  const [learned, setLearned] = useState<boolean | null>(null);

  useEffect(() => {
    if (!hasSessionHint()) return;
    const controller = new AbortController();
    meFetch<{ favourite: boolean; learnedAt: string | null }>(`/api/me/progress?slug=${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then((s) => setLearned(Boolean(s.learnedAt)))
      .catch(() => undefined);

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

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [slug]);

  if (learned === null) return null;
  return <LearnedToggle slug={slug} title={title} initial={learned} />;
}
