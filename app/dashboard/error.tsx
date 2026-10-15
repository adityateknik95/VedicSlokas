"use client";

import Link from "next/link";

/** A whole dashboard page failed. Calm, honest, and two ways forward. */
export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="dash-page">
      <div role="alert" className="dash-card mx-auto max-w-lg px-6 py-12 text-center">
        <p lang="sa" className="deva text-3xl text-accent">
          क्षम्यताम्
        </p>
        <h1 className="display mt-3 text-3xl text-ink">This page didn&apos;t load</h1>
        <p className="mt-2 text-sm text-ink-muted">Something went wrong on our side. Your favourites and progress are safe.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="inline-flex min-h-12 items-center rounded-full bg-saffron px-6 text-sm font-semibold text-on-saffron">
            Try again
          </button>
          <Link href="/dashboard" className="inline-flex min-h-12 items-center rounded-full border border-line px-6 text-sm font-semibold text-ink hover:border-gold">
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
