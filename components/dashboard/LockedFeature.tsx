import Link from "next/link";
import type { ReactNode } from "react";
import { Mandala } from "@/components/motifs";

/**
 * Shown when a module is live but this student's plan does not include it.
 * TODO(payments): point "See plans" at the real pricing page once subscriptions exist.
 */
export function LockedFeature({ title, summary, icon }: { title: string; summary?: string; icon: ReactNode }) {
  return (
    <section aria-labelledby="locked-title" className="dash-card relative overflow-hidden px-6 py-12 text-center sm:px-12">
      <Mandala variant="simple" className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 text-gold opacity-[0.06]" />
      <div className="relative">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-gold/50 text-accent">{icon}</div>
        <h2 id="locked-title" className="display mt-5 text-3xl text-ink">
          {title} is part of a plan
        </h2>
        {summary && <p className="mx-auto mt-3 max-w-md text-ink-muted">{summary}</p>}
        <p className="mx-auto mt-3 max-w-md text-sm text-ink-muted">Plans are not open yet. Everything in the library stays free for you meanwhile.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <span aria-disabled="true" className="inline-flex min-h-12 cursor-not-allowed items-center rounded-full border border-line px-6 text-sm font-semibold text-ink-muted">
            See plans (coming soon)
          </span>
          <Link href="/dashboard/library" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-saffron px-6 text-sm font-semibold text-on-saffron">
            Back to the library <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
