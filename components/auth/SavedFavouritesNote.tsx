"use client";

import { useFavorites } from "@/lib/favorites";

/** On sign up: what this device has saved will come along. The merge itself happens at sign in. */
export function SavedFavouritesNote() {
  const { favorites, mode } = useFavorites();
  if (mode !== "local" || !favorites.length) return null;
  const n = favorites.length;
  return <p className="rounded-2xl border border-gold/40 bg-surface px-4 py-3 text-center text-sm text-ink">Your {n === 1 ? "saved sloka" : `${n} saved slokas`} will be added to your account.</p>;
}
