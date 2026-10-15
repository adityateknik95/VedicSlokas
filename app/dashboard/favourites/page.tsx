import type { Metadata } from "next";
import { FavouritesView } from "@/components/dashboard/FavouritesView";
import { dashboardUser } from "@/lib/dashboard/state";

export const metadata: Metadata = { title: "Favourites" };

/** The student's favourites, saved to their account. The data arrives with the layout (no extra request). */
export default async function FavouritesPage() {
  await dashboardUser("/dashboard/favourites");
  return (
    <div className="dash-page">
      <header className="dash-enter mb-8">
        <h1 className="display text-4xl text-ink sm:text-5xl">Favourites</h1>
        <p className="mt-2 text-ink-muted">The slokas you keep close, on every device you sign in to.</p>
      </header>
      <FavouritesView />
    </div>
  );
}
