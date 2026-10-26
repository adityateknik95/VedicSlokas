import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { Mandala } from "@/components/motifs";
import { Greeting } from "@/components/dashboard/Greeting";
import { SectionSkeleton } from "@/components/dashboard/Section";
import { SurpriseLauncher } from "@/components/dashboard/SurpriseLauncher";
import { FavouritesStrip } from "@/components/dashboard/home/FavouritesStrip";
import { BrowseByFeeling, ComingSoonRail, ContinueExploring, ProgressSummary } from "@/components/dashboard/home/sections";
import { TodaySloka } from "@/components/dashboard/home/TodaySloka";
import { NextClassCard } from "@/components/dashboard/classes/NextClassCard";
import { dashboardUser, entitlementsFor, prefsFor, studentState } from "@/lib/dashboard/state";
import { safeTimeZone } from "@/lib/dashboard/streak";
import { allSummaries } from "@/lib/dashboard/summaries";
import { isPersonalised, readingFor } from "@/lib/reading";
import { getSloka, getSlokaOfTheDay } from "@/lib/slokas";

export const metadata: Metadata = { title: "Home" };

const SUBLINE = {
  learn: "One verse is enough for today. Take it apart word by word.",
  recite: "One verse is enough for today. Say it aloud, slowly.",
  calm: "One verse is enough for today. Read it once, and breathe.",
  none: "One verse is enough for today. Here is where you left off.",
} as const;

/**
 * Dashboard home: a greeting, today's sloka (in the student's script and language), Surprise
 * me, then the student's own things, ordered by their goal: those here for calm see feelings
 * and favourites first. Sections that need their data stream in behind same-sized skeletons.
 * TODO(payments): plan and billing summary.
 */
export default async function DashboardHome() {
  const user = await dashboardUser("/dashboard");
  const prefs = await prefsFor(user.id);
  if (!prefs.onboardedAt) redirect("/dashboard/welcome");

  const tz = safeTimeZone(prefs.timezone);
  const [entitlements, state] = await Promise.all([entitlementsFor(user.id), studentState(user.id).catch(() => null)]);
  const now = new Date();
  const serverHour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: tz }).format(now));
  const dateLabel = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(now);
  const firstName = user.name.trim().split(/\s+/)[0] || "friend";

  const today = getSlokaOfTheDay(now);
  const reading = isPersonalised(prefs.script, prefs.meaningLang) ? readingFor(today, prefs.script, prefs.meaningLang) : null;
  const last = state?.progress.find((p) => p.slug !== today.slug);
  const lastSloka = last ? getSloka(last.slug) : undefined;
  const continueTo = lastSloka ? { slug: lastSloka.slug, title: lastSloka.title } : null;

  const sections: Record<string, ReactNode> = {
    classes: (
      // No placeholder: the card only appears once a class is scheduled.
      <Suspense key="classes" fallback={null}>
        <NextClassCard tz={tz} entitled={entitlements.liveClasses} />
      </Suspense>
    ),
    progress: (
      <Suspense key="progress" fallback={<SectionSkeleton title="your progress" height="h-[24rem] sm:h-[17rem]" />}>
        <ProgressSummary userId={user.id} />
      </Suspense>
    ),
    continue: (
      <Suspense key="continue" fallback={<SectionSkeleton title="your recent slokas" height="h-[9.5rem]" />}>
        <ContinueExploring userId={user.id} />
      </Suspense>
    ),
    favourites: <FavouritesStrip key="favourites" summaries={allSummaries()} />,
    feeling: <BrowseByFeeling key="feeling" lead={prefs.goal === "calm" ? "peace" : undefined} />,
    soon: (
      <Suspense key="soon" fallback={<SectionSkeleton title="coming soon" height="h-[16rem]" />}>
        <ComingSoonRail userId={user.id} />
      </Suspense>
    ),
  };
  const order = prefs.goal === "calm" ? ["feeling", "favourites", "progress", "continue", "classes", "soon"] : ["classes", "progress", "continue", "favourites", "feeling", "soon"];

  return (
    <div className="dash-page space-y-12">
      <header className="dash-enter">
        <Greeting firstName={firstName} serverHour={serverHour} />
        <p className="mt-2 text-ink-muted">{SUBLINE[prefs.goal ?? "none"]}</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <TodaySloka sloka={today} dateLabel={dateLabel} reading={reading} reciteFirst={prefs.goal === "recite"} continueTo={continueTo} />
        <section aria-labelledby="surprise-title-home" className="dash-card dash-enter relative flex flex-col justify-between overflow-hidden p-6 sm:p-8" style={{ ["--i" as string]: 1 }}>
          <Mandala variant="simple" className="spin-slow pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 text-gold opacity-[0.09]" />
          <div className="relative">
            <p className="eyebrow">Surprise me</p>
            <h2 id="surprise-title-home" className="display mt-2 text-3xl leading-tight text-ink">
              Let a verse find you
            </h2>
            <p className="mt-2 max-w-xs text-sm text-ink-muted">One tap, one sloka. We lean towards ones you have not met yet.</p>
          </div>
          <div className="relative mt-8">
            <SurpriseLauncher />
          </div>
        </section>
      </div>

      {order.map((key) => sections[key])}
    </div>
  );
}
