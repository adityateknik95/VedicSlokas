"use client";

import Link from "next/link";
import { useSignedInHint } from "@/lib/session-hint";

/** Guests keep favourites on this device, in the library; members have their own page. */
export function useFavouritesHref(): string {
  return useSignedInHint() ? "/dashboard/favourites" : "/library?favorites=1";
}

export function FavouritesLink({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <Link href={useFavouritesHref()} className={className}>
      {children}
    </Link>
  );
}
