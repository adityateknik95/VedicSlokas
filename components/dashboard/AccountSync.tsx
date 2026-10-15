"use client";

import { useEffect, useLayoutEffect } from "react";
import { seedFavourites, type FavouriteEntry } from "@/lib/favorites";
import { browserTimeZone, meFetch } from "@/lib/dashboard/client";

/**
 * Hands the server's favourites to the client store (no second request, no flicker) and, the
 * first time, saves the browser's timezone so streaks and greetings use the student's own day.
 */
export function AccountSync({ favourites, timezone }: { favourites: FavouriteEntry[]; timezone: string | null }) {
  // Before paint, so favourite buttons never flash from empty to filled.
  useLayoutEffect(() => seedFavourites(favourites), [favourites]);
  useEffect(() => {
    if (timezone) return;
    void meFetch("/api/me/prefs", { method: "PATCH", body: { timezone: browserTimeZone() } }).catch(() => undefined);
  }, [timezone]);
  return null;
}
