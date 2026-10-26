import type { Metadata } from "next";
import { FavouritesView } from "@/components/dashboard/FavouritesView";
import { listCollections, noteSlugs } from "@/lib/dashboard/library-data";
import { dashboardUser } from "@/lib/dashboard/state";

export const metadata: Metadata = { title: "Favourites" };

/** The student's favourites and collections. Favourites arrive with the layout; collections and note marks load here. */
export default async function FavouritesPage() {
  const user = await dashboardUser("/dashboard/favourites");
  const [collections, notes] = await Promise.all([listCollections(user.id), noteSlugs(user.id)]);
  return (
    <div className="dash-page">
      <header className="dash-enter mb-8">
        <h1 className="display text-4xl text-ink sm:text-5xl">Favourites</h1>
        <p className="mt-2 text-ink-muted">The slokas you keep close, and your own collections, on every device you sign in to.</p>
      </header>
      <FavouritesView initialCollections={collections} noted={notes} />
    </div>
  );
}
