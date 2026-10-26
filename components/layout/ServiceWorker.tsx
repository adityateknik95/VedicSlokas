"use client";

import { useEffect } from "react";
import { useFavorites } from "@/lib/favorites";

/**
 * Registers the service worker (production only) and tells it which slokas are favourites,
 * so it keeps exactly those readable offline. Works signed in or out.
 */
export function ServiceWorker() {
  const { favorites, ready } = useFavorites();
  const key = favorites.join(",");

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !ready || !("serviceWorker" in navigator)) return;
    const slugs = key ? key.split(",") : [];
    void navigator.serviceWorker.ready.then((reg) => reg.active?.postMessage({ type: "favourites", slugs })).catch(() => undefined);
  }, [key, ready]);

  return null;
}
