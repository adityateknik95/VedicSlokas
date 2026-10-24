import Link from "next/link";
import type { ReactNode } from "react";
import { Mandala } from "@/components/motifs";

/** Shown when a module is live but this student's plan does not include it. */
export function LockedFeature({ title, summary, icon, planHref }: { title: string; summary?: string; icon: ReactNode; planHref: string | null }) {
  return (
    <section aria-labelledby="locked-title" className="dash-card relative overflow-hidden px-6 py-12 text-center sm:px-12">
      <Mandala variant="simple" className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 text-gold opacity-[0.06]" />
      <div className="relative">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-gold/50 text-accent">{icon}</div>
        <h2 id="locked-title" className="display mt-5 text-3xl text-ink">
          {title} is part of a plan
        </h2>
        {summary && <p className="mx-auto mt-3 max-w-md text-ink-muted">{summary}</p>}
        <p className="mx-auto mt-3 max-w-md text-sm text-ink-muted">Everything in the library stays free for you.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {planHref ? (
            <Link href={planHref} className="inline-flex min-h-12 items-center rounded-full border border-gold/60 px-6 text-sm font-semibold text-ink hover:bg-gold/10">
              See the monthly plan
            </Link>
          ) : (
            <span aria-disabled="true" className="inline-flex min-h-12 cursor-not-allowed items-center rounded-full border border-line px-6 text-sm font-semibold text-ink-muted">
              Plans open soon
            </span>
          )}
          <Link href="/dashboard/library" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-saffron px-6 text-sm font-semibold text-on-saffron">
            Back to the library <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
