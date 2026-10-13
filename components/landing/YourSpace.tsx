import { Container, Eyebrow } from "@/components/ui";
import { YOUR_SPACE_COPY } from "@/lib/landing-copy";
import { getFeatured, getSlokaOfTheDay } from "@/lib/slokas";
import { AuthAwareCta } from "./AuthAwareCta";

const PROGRESS = { read: 6, total: 20 }; // sample data for the preview only

/**
 * Scene seven: what a free account gives. The dashboard preview is built from the site's
 * real card styles with clearly labelled sample data, and is inert (look, don't touch).
 * TODO(dashboard): swap the preview for live components once the real dashboard ships.
 */
export function YourSpace() {
  const today = getSlokaOfTheDay();
  const saved = getFeatured().slice(0, 3);
  const r = 26;
  const circumference = 2 * Math.PI * r;

  return (
    <section aria-labelledby="space-title" className="defer-render relative overflow-hidden py-24 sm:py-32">
      <Container className="grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <figure className="relative order-2 lg:order-1" aria-labelledby="space-preview-caption">
          <div inert className="card overflow-hidden !rounded-[1.75rem] p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
              <p className="display text-2xl text-ink">{YOUR_SPACE_COPY.previewGreeting}</p>
              <span className="rounded-full border border-saffron/60 bg-saffron/15 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-flame">
                {YOUR_SPACE_COPY.previewLabel}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="lamp-card card p-5 sm:col-span-2">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[var(--lamp-flame)]">{YOUR_SPACE_COPY.previewToday}</p>
                <p lang="sa" className="deva lamp-deva mt-2 text-2xl leading-relaxed">
                  {today.devanagari.split("\n")[0].replace(/[।॥]/g, "").trim()}
                </p>
                <p className="display text-xl text-[var(--lamp-ink)]">{today.title}</p>
              </div>

              <div className="rounded-2xl border border-line bg-surface p-5">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-ink-muted">{YOUR_SPACE_COPY.previewSaved}</p>
                <ul className="mt-3 space-y-2.5">
                  {saved.map((s) => (
                    <li key={s.slug} className="flex items-center gap-2.5 text-sm text-ink">
                      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-flame" fill="currentColor" aria-hidden="true">
                        <path d="M12 3c2.6 2.8 3.6 6.2 0 11-3.6-4.8-2.6-8.2 0-11Z" />
                        <path d="M12 14c1.2-3.6 4-6 7.5-6.5-.2 4.4-3 7-7.5 6.5ZM12 14c-1.2-3.6-4-6-7.5-6.5.2 4.4 3 7 7.5 6.5Z" />
                      </svg>
                      <span className="truncate">{s.title}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5">
                <svg viewBox="0 0 64 64" className="h-16 w-16 shrink-0 -rotate-90" aria-hidden="true">
                  <circle cx="32" cy="32" r={r} fill="none" stroke="var(--line)" strokeWidth="5" />
                  <circle
                    cx="32"
                    cy="32"
                    r={r}
                    fill="none"
                    stroke="var(--saffron)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - PROGRESS.read / PROGRESS.total)}
                  />
                </svg>
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-ink-muted">{YOUR_SPACE_COPY.previewProgress}</p>
                  <p className="display mt-1 text-2xl text-ink">{YOUR_SPACE_COPY.previewProgressValue}</p>
                  <span className="mt-2 inline-flex min-h-9 items-center gap-2 rounded-full border border-line px-3 text-xs font-semibold text-ink">
                    <span aria-hidden="true" className="text-flame">✦</span>
                    {YOUR_SPACE_COPY.previewSurprise}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <figcaption id="space-preview-caption" className="mt-3 text-center text-xs text-ink-muted">
            {YOUR_SPACE_COPY.previewCaption}
          </figcaption>
        </figure>

        <div className="order-1 lg:order-2">
          <div data-reveal>
            <Eyebrow>{YOUR_SPACE_COPY.eyebrow}</Eyebrow>
          </div>
          <h2 id="space-title" data-reveal style={{ ["--i" as string]: 1 }} className="display mt-4 text-4xl text-ink sm:text-5xl md:text-6xl">
            {YOUR_SPACE_COPY.title}
          </h2>
          <p data-reveal style={{ ["--i" as string]: 2 }} className="mt-5 text-lg text-ink-muted">
            {YOUR_SPACE_COPY.lede}
          </p>
          <ul data-reveal style={{ ["--i" as string]: 3 }} className="mt-6 space-y-2.5">
            {YOUR_SPACE_COPY.points.map((point) => (
              <li key={point} className="flex items-center gap-3 text-ink">
                <span aria-hidden="true" className="grid h-6 w-6 place-items-center rounded-full border border-gold/60 text-xs text-accent">
                  ✓
                </span>
                {point}
              </li>
            ))}
          </ul>
          <div data-reveal style={{ ["--i" as string]: 4 }} className="mt-8">
            <AuthAwareCta guest={{ href: "/signup", label: YOUR_SPACE_COPY.cta }} member={{ href: "/dashboard", label: YOUR_SPACE_COPY.ctaSignedIn }} className="w-full sm:w-[17rem]" />
          </div>

          {/* Honest teaser: no dates, no prices, no names.
              TODO(classes): replace with the class timetable, courses and pricing once finalised. */}
          <aside data-reveal style={{ ["--i" as string]: 5 }} className="mt-10 rounded-[1.4rem] border border-dashed border-gold/50 bg-surface p-5 sm:p-6" aria-labelledby="teaser-title">
            <span className="inline-flex rounded-full bg-saffron/15 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-flame">
              {YOUR_SPACE_COPY.teaserBadge}
            </span>
            <h3 id="teaser-title" className="display mt-3 text-2xl text-ink">
              {YOUR_SPACE_COPY.teaserTitle}
            </h3>
            <p className="mt-1 text-sm text-ink-muted">{YOUR_SPACE_COPY.teaserBody}</p>
          </aside>
        </div>
      </Container>
    </section>
  );
}
