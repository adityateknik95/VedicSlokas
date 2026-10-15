import Link from "next/link";
import type { ReactNode } from "react";

/** A titled dashboard section. `action` is an optional "See all" style link. */
export function Section({ id, title, eyebrow, action, children, className = "" }: { id: string; title: string; eyebrow?: string; action?: { href: string; label: string }; children: ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={className}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
          <h2 id={id} className="dash-section-title">
            {title}
          </h2>
        </div>
        {action && (
          <Link href={action.href} className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full px-3 text-sm font-semibold text-flame hover:bg-surface-2">
            {action.label} <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** Same footprint as the content, so nothing jumps when it streams in. */
export function SkeletonBlock({ className }: { className: string }) {
  return <div aria-hidden="true" className={`skeleton rounded-[1.4rem] ${className}`} />;
}

export function SectionSkeleton({ title, height }: { title: string; height: string }) {
  return (
    <div role="status" aria-label={`Loading ${title}`}>
      <div className="skeleton mb-4 h-9 w-48 rounded-xl" aria-hidden="true" />
      <SkeletonBlock className={height} />
    </div>
  );
}

/** Calm failure state for one section; the rest of the page keeps working. */
export function SectionError({ what }: { what: string }) {
  return (
    <div role="alert" className="dash-card px-6 py-8 text-center">
      <p className="text-ink">We couldn&apos;t load {what} just now.</p>
      <p className="mt-1 text-sm text-ink-muted">Refresh the page in a moment. Everything you saved is safe.</p>
    </div>
  );
}

/** Friendly empty state with one clear next step. */
export function EmptyState({ deva, title, body, cta }: { deva: string; title: string; body: string; cta?: { href: string; label: string } }) {
  return (
    <div className="dash-card px-6 py-10 text-center">
      <p lang="sa" className="deva text-3xl text-accent">
        {deva}
      </p>
      <p className="display mt-2 text-2xl text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">{body}</p>
      {cta && (
        <Link href={cta.href} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-saffron px-5 text-sm font-semibold text-on-saffron transition-transform hover:-translate-y-0.5">
          {cta.label} <span aria-hidden="true">→</span>
        </Link>
      )}
    </div>
  );
}
