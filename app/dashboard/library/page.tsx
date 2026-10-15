import type { Metadata } from "next";
import { Suspense } from "react";
import { LibraryBrowser } from "@/components/library/LibraryBrowser";
import { SkeletonBlock } from "@/components/dashboard/Section";
import { dashboardUser, studentState } from "@/lib/dashboard/state";
import { getPlanState } from "@/lib/subscriptions";
import { slokas } from "@/lib/slokas";

export const metadata: Metadata = { title: "Library" };

/**
 * The library inside the app: the same browser as the public /library page (which stays
 * static), with favourites on the account and "new to you" / learned badges.
 */
export default async function DashboardLibraryPage() {
  const user = await dashboardUser("/dashboard/library");
  const [state, plan] = await Promise.all([studentState(user.id).catch(() => null), getPlanState(user.id)]);
  const account = {
    viewed: state?.progress.map((p) => p.slug) ?? [],
    learned: state?.progress.filter((p) => p.learnedAt).map((p) => p.slug) ?? [],
  };

  return (
    <div className="dash-page">
      <header className="dash-enter mb-8">
        <h1 className="display text-4xl text-ink sm:text-5xl">Library</h1>
        <p className="mt-2 text-ink-muted">Search in plain English, IAST or Devanagari. Badges show what is new to you.</p>
      </header>
      <Suspense fallback={<SkeletonBlock className="h-[40rem]" />}>
        <LibraryBrowser account={account} allowedSlugs={plan.status === "active" ? undefined : slokas.slice(0, 7).map((s) => s.slug)} />
      </Suspense>
    </div>
  );
}
