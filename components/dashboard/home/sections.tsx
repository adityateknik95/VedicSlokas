import Link from "next/link";
import { Mandala } from "@/components/motifs";
import { CompactSlokaCard } from "@/components/dashboard/CompactSlokaCard";
import { InterestToggle } from "@/components/dashboard/InterestToggle";
import { ProgressRing } from "@/components/dashboard/ProgressRing";
import { EmptyState, Section, SectionError } from "@/components/dashboard/Section";
import { modulesFor } from "@/lib/dashboard/modules";
import { studentState } from "@/lib/dashboard/state";
import { computeStreak, dayKey } from "@/lib/dashboard/streak";
import { summarise } from "@/lib/dashboard/summaries";
import { getSloka, slokas, THEMES, themeInfo } from "@/lib/slokas";

/** Server sections of Home. Each catches its own failure so the rest of the page still works. */

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export async function ProgressSummary({ userId }: { userId: string }) {
  const state = await studentState(userId).catch(() => null);
  if (!state) return <SectionError what="your progress" />;

  const explored = state.progress.length;
  const learned = state.progress.filter((p) => p.learnedAt).length;
  const streak = computeStreak(state.activeDays, state.today);
  const total = slokas.length;

  return (
    <Section id="home-progress" title="Your progress" action={{ href: "/dashboard/progress", label: "Details" }}>
      <div className="dash-card dash-enter grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:items-center sm:p-7">
        <ProgressRing value={explored} total={total} label={`Explored ${explored} of ${total} slokas`}>
          <div>
            <p className="display text-4xl leading-none text-ink">{explored}</p>
            <p className="mt-1 text-xs text-ink-muted">of {total} explored</p>
          </div>
        </ProgressRing>
        <dl className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-line p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">Learned</dt>
            <dd className="display mt-1 text-3xl text-ink">{learned}</dd>
            <dd className="text-xs text-ink-muted">{learned ? "Committed to memory" : "Mark one as learned when it feels like yours"}</dd>
          </div>
          <div className="rounded-2xl border border-line p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">Streak</dt>
            <dd className="display mt-1 text-3xl text-ink">{plural(streak.current, "day", "days")}</dd>
            <dd className="text-xs text-ink-muted">
              {streak.current === 0 ? "Open any sloka today to begin one." : streak.activeToday ? "You read today. Lovely." : "Open a sloka today to keep it going."}
            </dd>
          </div>
        </dl>
      </div>
    </Section>
  );
}

function daysAgo(today: string, iso: string, tz: string): string {
  const then = dayKey(new Date(iso), tz);
  const diff = Math.round((Date.parse(today) - Date.parse(then)) / 86_400_000);
  return diff <= 0 ? "Opened today" : diff === 1 ? "Opened yesterday" : `Opened ${diff} days ago`;
}

export async function ContinueExploring({ userId }: { userId: string }) {
  const state = await studentState(userId).catch(() => null);
  if (!state) return <SectionError what="your recent slokas" />;
  const recent = state.progress.slice(0, 5);

  return (
    <Section id="home-continue" title="Continue exploring" action={recent.length ? { href: "/dashboard/progress#history", label: "History" } : undefined}>
      {recent.length ? (
        <ul className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-5">
          {recent.map((p, i) => {
            const s = getSloka(p.slug);
            return s ? (
              <li key={p.slug}>
                <CompactSlokaCard sloka={summarise(s)} note={daysAgo(state.today, p.lastViewedAt, state.tz)} index={i} />
              </li>
            ) : null;
          })}
        </ul>
      ) : (
        <EmptyState deva="आरम्भः" title="Your first sloka is waiting" body="Slokas you open will gather here, so you can always pick up where you left off." cta={{ href: "/dashboard/library", label: "Open the library" }} />
      )}
    </Section>
  );
}

export function BrowseByFeeling() {
  return (
    <Section id="home-feeling" title="Browse by feeling">
      <ul className="flex flex-wrap gap-2.5">
        {THEMES.map((t) => (
          <li key={t}>
            <Link href={`/dashboard/library?theme=${t}`} className="dash-chip">
              <span lang="sa" aria-hidden="true" className="deva text-base leading-none text-accent">
                {themeInfo[t].devanagari}
              </span>
              {themeInfo[t].label}
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export async function ComingSoonRail({ userId }: { userId: string }) {
  const state = await studentState(userId).catch(() => null);
  const interest = new Set(state?.interest ?? []);
  return (
    <Section id="home-soon" eyebrow="Coming soon" title="Shaping what comes next">
      <p className="-mt-2 mb-5 max-w-2xl text-sm text-ink-muted">We are still shaping these. Tell us you want one and we will let you know.</p>
      <ul className="grid gap-4 md:grid-cols-3">
        {modulesFor("homeRail").map((m, i) => (
          <li key={m.key} style={{ ["--i" as string]: i }} className="dash-card dash-card-hover dash-enter relative flex flex-col overflow-hidden p-6">
            <Mandala variant="simple" className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 text-gold opacity-[0.07]" />
            <h3 className="display text-2xl text-ink">
              <Link href={m.href} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-[1.4rem] focus-visible:after:outline-2 focus-visible:after:outline-flame focus-visible:after:outline-solid">
                {m.label}
              </Link>
            </h3>
            <p className="mt-2 flex-1 text-sm text-ink-muted">{m.summary}</p>
            {m.key === "classes" && (
              <div className="mt-4 rounded-xl border border-dashed border-line px-4 py-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-ink-muted">Next class</p>
                <p className="mt-0.5 text-sm text-ink">Class schedule coming soon.</p>
              </div>
            )}
            {m.feature && (
              <div className="relative z-10 mt-5">
                <InterestToggle feature={m.feature} label={m.label} initial={interest.has(m.feature)} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}
