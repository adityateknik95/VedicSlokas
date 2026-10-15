import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LearnedToggle } from "@/components/dashboard/LearnedToggle";
import { ProgressRing } from "@/components/dashboard/ProgressRing";
import { EmptyState, Section, SectionError, SectionSkeleton } from "@/components/dashboard/Section";
import { StreakCalendar } from "@/components/dashboard/StreakCalendar";
import { dashboardUser, studentState } from "@/lib/dashboard/state";
import { computeStreak } from "@/lib/dashboard/streak";
import { getSloka, slokas, SOURCES } from "@/lib/slokas";

export const metadata: Metadata = { title: "Progress" };

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

async function ProgressBody({ userId }: { userId: string }) {
  const state = await studentState(userId).catch(() => null);
  if (!state) return <SectionError what="your progress" />;

  const bySlug = new Map(state.progress.map((p) => [p.slug, p]));
  const explored = state.progress.length;
  const learned = state.progress.filter((p) => p.learnedAt).length;
  const streak = computeStreak(state.activeDays, state.today);
  const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: state.tz });

  return (
    <div className="space-y-12">
      <section aria-labelledby="overview-title" className="dash-card dash-enter grid gap-8 p-6 sm:p-8 lg:grid-cols-[auto_1fr_1fr] lg:items-center">
        <h2 id="overview-title" className="sr-only">
          Overview
        </h2>
        <ProgressRing value={explored} total={slokas.length} size={156} label={`Explored ${explored} of ${slokas.length} slokas`}>
          <div>
            <p className="display text-5xl leading-none text-ink">{explored}</p>
            <p className="mt-1 text-xs text-ink-muted">of {slokas.length} explored</p>
          </div>
        </ProgressRing>
        <dl className="grid grid-cols-2 gap-4 lg:col-span-2 lg:grid-cols-4">
          {[
            { k: "Learned", v: String(learned), note: "marked as yours" },
            { k: "Current streak", v: plural(streak.current, "day", "days"), note: streak.activeToday ? "including today" : "open one today to continue" },
            { k: "Longest streak", v: plural(streak.longest, "day", "days"), note: "your best run" },
            { k: "Still to meet", v: String(slokas.length - explored), note: "new verses waiting" },
          ].map((item) => (
            <div key={item.k} className="rounded-2xl border border-line p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">{item.k}</dt>
              <dd className="display mt-1 text-3xl text-ink">{item.v}</dd>
              <dd className="text-xs text-ink-muted">{item.note}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Section id="calendar-title" title="The last 12 weeks">
        <div className="dash-card p-6">
          <StreakCalendar activeDays={state.activeDays} today={state.today} />
        </div>
      </Section>

      <Section id="by-source-title" title="By source">
        <div className="grid gap-4 md:grid-cols-2">
          {SOURCES.map((source) => {
            const all = slokas.filter((s) => s.source === source);
            const seen = all.filter((s) => bySlug.has(s.slug));
            return (
              <section key={source} aria-labelledby={`src-${source}`} className="dash-card p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 id={`src-${source}`} className="display text-2xl text-ink">
                    {source}
                  </h3>
                  <p className="text-sm text-ink-muted">
                    {seen.length} of {all.length} explored
                  </p>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
                  <div className="h-full rounded-full bg-saffron" style={{ width: `${(seen.length / Math.max(1, all.length)) * 100}%` }} />
                </div>
                {seen.length ? (
                  <ul className="mt-4 divide-y divide-line">
                    {seen.map((s) => (
                      <li key={s.slug} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                        <Link href={`/sloka/${s.slug}`} className="flex min-h-11 min-w-0 flex-1 items-center truncate text-ink hover:text-accent">
                          {s.title}
                        </Link>
                        <LearnedToggle slug={s.slug} title={s.title} initial={Boolean(bySlug.get(s.slug)?.learnedAt)} compact refresh />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-ink-muted">
                    Nothing opened here yet.{" "}
                    <Link href={`/dashboard/library?source=${encodeURIComponent(source)}`} className="font-semibold text-flame underline-offset-4 hover:underline">
                      Start with {source}
                    </Link>
                  </p>
                )}
              </section>
            );
          })}
        </div>
      </Section>

      <Section id="history" title="Recently viewed">
        {state.progress.length ? (
          <ol className="dash-card divide-y divide-line">
            {state.progress.slice(0, 20).map((p) => {
              const s = getSloka(p.slug);
              return s ? (
                <li key={p.slug} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                  <Link href={`/sloka/${s.slug}`} className="flex min-h-11 min-w-0 flex-1 items-center truncate font-medium text-ink hover:text-accent">
                    {s.title}
                  </Link>
                  <span className="text-sm text-ink-muted">
                    {dateFmt.format(new Date(p.lastViewedAt))} · {plural(p.viewCount, "day", "days")} opened
                  </span>
                </li>
              ) : null;
            })}
          </ol>
        ) : (
          <EmptyState deva="आरम्भः" title="Your story starts with one sloka" body="Open any verse and it will appear here, with your streak counting from today." cta={{ href: "/dashboard/library", label: "Open the library" }} />
        )}
      </Section>
    </div>
  );
}

export default async function ProgressPage() {
  const user = await dashboardUser("/dashboard/progress");
  return (
    <div className="dash-page">
      <header className="dash-enter mb-8">
        <h1 className="display text-4xl text-ink sm:text-5xl">Your progress</h1>
        <p className="mt-2 text-ink-muted">A quiet record of what you have read and learned. No pressure: every verse counts.</p>
      </header>
      <Suspense fallback={<SectionSkeleton title="your progress" height="h-[36rem]" />}>
        <ProgressBody userId={user.id} />
      </Suspense>
    </div>
  );
}
