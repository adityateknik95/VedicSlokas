import Link from "next/link";
import type { ReactNode } from "react";
import type { Feature } from "@/db/schema";
import { Mandala } from "@/components/motifs";
import { getModule, moduleAccess, type ModuleKey } from "@/lib/dashboard/modules";
import { dashboardUser, entitlementsFor, interestFor } from "@/lib/dashboard/state";
import { canUseSubscriptions } from "@/lib/subscriptions";
import { DashIcon } from "./DashIcon";
import { InterestToggle } from "./InterestToggle";
import { LockedFeature } from "./LockedFeature";

const DEVA: Partial<Record<ModuleKey, { word: string; gloss: string }>> = {
  classes: { word: "कक्षा", gloss: "kakṣā, a class" },
  notes: { word: "टिप्पणी", gloss: "ṭippaṇī, a note" },
  courses: { word: "पाठ्यक्रमः", gloss: "pāṭhyakramaḥ, a course of study" },
};

/**
 * One page for every registry module. It decides from the registry and the student's
 * entitlements: coming soon (with Notify me), locked (upgrade placeholder), or open (children).
 * When a module launches, its page passes real content as children and nothing else changes.
 */
export async function ModulePage({ moduleKey, children }: { moduleKey: ModuleKey; children?: ReactNode }) {
  const module = getModule(moduleKey);
  const user = await dashboardUser(module.href === "surprise" ? "/dashboard" : module.href);
  const [entitlements, interest] = await Promise.all([entitlementsFor(user.id), interestFor(user.id).catch((): Feature[] => [])]);
  const access = moduleAccess(module, entitlements);
  const deva = DEVA[moduleKey];
  const icon = <DashIcon name={module.icon} className="h-7 w-7" />;

  return (
    <div className="dash-page">
      <header className="dash-enter mb-8">
        <p className="eyebrow">{access === "soon" ? "Coming soon" : access === "open" ? "Open to you" : "Included in plans"}</p>
        <h1 className="display mt-2 text-4xl text-ink sm:text-5xl">{module.label}</h1>
      </header>

      {access === "open" && children}
      {access === "locked" && <LockedFeature title={module.label} summary={module.summary} icon={icon} planHref={canUseSubscriptions(user) ? "/dashboard/upgrade" : null} />}
      {access === "soon" && (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <section aria-labelledby="soon-what" className="dash-card dash-enter relative overflow-hidden p-7 sm:p-10">
            <Mandala variant="simple" className="spin-slow pointer-events-none absolute -right-24 -top-24 h-80 w-80 text-gold opacity-[0.08]" />
            <div className="relative">
              <div className="grid h-16 w-16 place-items-center rounded-full border border-gold/50 bg-[radial-gradient(circle_at_30%_30%,rgb(232_137_28/0.25),transparent_70%)] text-accent">{icon}</div>
              {deva && (
                <p className="mt-6">
                  <span lang="sa" className="deva text-3xl text-accent">
                    {deva.word}
                  </span>
                  <span className="ml-3 text-sm italic text-ink-muted">{deva.gloss}</span>
                </p>
              )}
              <h2 id="soon-what" className="display mt-4 text-3xl leading-tight text-ink">
                {module.summary}
              </h2>
              <p className="mt-4 max-w-lg text-ink-muted">We are still shaping this. Tell us you want it and we will let you know.</p>
              {module.feature && (
                <div className="mt-7">
                  <InterestToggle feature={module.feature} label={module.label} initial={interest.includes(module.feature)} />
                </div>
              )}
            </div>
          </section>

          <section aria-labelledby="soon-plan" className="dash-card dash-enter p-7 sm:p-10" style={{ ["--i" as string]: 1 }}>
            <h2 id="soon-plan" className="eyebrow">
              What we are planning
            </h2>
            <ul className="mt-5 space-y-4">
              {module.planned?.map((item) => (
                <li key={item} className="flex gap-3 text-ink">
                  <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-saffron shadow-[0_0_8px_1px_var(--glow)]" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="dash-hairline my-7" />
            <p className="text-sm text-ink-muted">Until then, every sloka in the library is open to you.</p>
            <Link href="/dashboard/library" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-semibold text-ink hover:border-gold">
              Back to the library <span aria-hidden="true">→</span>
            </Link>
          </section>
        </div>
      )}
    </div>
  );
}
