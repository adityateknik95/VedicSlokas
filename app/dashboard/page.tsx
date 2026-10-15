import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Mandala } from "@/components/motifs";
import { Greeting } from "@/components/dashboard/Greeting";
import { SectionSkeleton } from "@/components/dashboard/Section";
import { SurpriseLauncher } from "@/components/dashboard/SurpriseLauncher";
import { FavouritesStrip } from "@/components/dashboard/home/FavouritesStrip";
import { BrowseByFeeling, ComingSoonRail, ContinueExploring, ProgressSummary } from "@/components/dashboard/home/sections";
import { TodaySloka } from "@/components/dashboard/home/TodaySloka";
import { dashboardUser, prefsFor } from "@/lib/dashboard/state";
import { safeTimeZone } from "@/lib/dashboard/streak";
import { allSummaries } from "@/lib/dashboard/summaries";
import { getSlokaOfTheDay } from "@/lib/slokas";
import { getPlanState } from "@/lib/subscriptions";

export const metadata: Metadata = { title: "Home" };

/**
 * Dashboard home: a greeting, today's sloka, Surprise me, then the student's own things.
 * Sections that need their data stream in behind same-sized skeletons.
 * TODO(classes): replace the coming-soon rail entries with live modules as they launch
 * (flip them in lib/dashboard/modules.ts). TODO(payments): plan and billing summary.
 */
export default async function DashboardHome() {
  const user = await dashboardUser("/dashboard");
  const [prefs, plan] = await Promise.all([prefsFor(user.id), getPlanState(user.id)]);
  if (!prefs.onboardedAt) redirect("/dashboard/welcome");

  const tz = safeTimeZone(prefs.timezone);
  const now = new Date();
  const serverHour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: tz }).format(now));
  const dateLabel = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(now);
  const firstName = user.name.trim().split(/\s+/)[0] || "friend";

  return (
    <div className="dash-page space-y-12">
      <header className="dash-enter">
        <Greeting firstName={firstName} serverHour={serverHour} />
        <p className="mt-2 text-ink-muted">One verse is enough for today. Here is where you left off.</p>
      </header>

      <section className="dash-card flex flex-wrap items-center justify-between gap-4 p-5">
        <div><p className="eyebrow">Your plan</p><p className="mt-1 font-semibold text-ink">{plan.status === "active" ? (plan.payment?.status === "verified" ? "Payment transaction completed · Subscription active" : "Monthly Subscription · Full access") : plan.status === "trial" ? "Free Trial · Up to 7 slokas" : plan.status === "pending" ? "Payment pending verification" : "Free access · Choose a plan"}</p><p className="mt-1 text-sm text-ink-muted">{plan.status === "active" ? `Subscription valid until ${new Date(plan.subscriptionExpiresAt!).toLocaleDateString("en-IN")}` : plan.status === "pending" ? "Your full subscription starts after the payment is verified." : "Upgrade any time for the complete learning library."}</p></div>
        <a href="/dashboard/upgrade" className="inline-flex min-h-11 items-center rounded-full bg-gold px-5 text-sm font-bold text-[#24170b]">{plan.status === "active" ? "Manage plan" : "Upgrade plan"}</a>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <TodaySloka sloka={getSlokaOfTheDay(now)} dateLabel={dateLabel} />
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

      <Suspense fallback={<SectionSkeleton title="your progress" height="h-[19rem] sm:h-[11.5rem]" />}>
        <ProgressSummary userId={user.id} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton title="your recent slokas" height="h-[9.5rem]" />}>
        <ContinueExploring userId={user.id} />
      </Suspense>

      <FavouritesStrip summaries={allSummaries()} />

      <BrowseByFeeling />

      <Suspense fallback={<SectionSkeleton title="coming soon" height="h-[16rem]" />}>
        <ComingSoonRail userId={user.id} />
      </Suspense>
    </div>
  );
}
