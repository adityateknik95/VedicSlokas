import Link from "next/link";
import { Diya, Mandala } from "@/components/motifs";
import { SOURCES, THEMES, themeInfo, slokas } from "@/lib/slokas";

const linkCls = "inline-flex min-h-9 items-center text-ink-muted transition-colors hover:text-accent";

export function Footer() {
  const pending = slokas.filter((s) => !s.verified).length;
  return (
    <footer className="defer-render relative mt-24 overflow-hidden border-t border-line bg-charcoal/60 [contain-intrinsic-size:auto_640px]">
      <Mandala className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] text-gold opacity-[0.07]" variant="simple" />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-12">
        <div className="md:col-span-4">
          <Link href="/" className="flex items-center gap-2.5" aria-label="VedicSlokas home">
            <Diya className="h-10 w-10" />
            <span className="display text-3xl text-ink">
              Vedic<span className="text-accent">Slokas</span>
            </span>
          </Link>
          <p className="mt-5 max-w-xs text-sm text-ink-muted">
            The oldest words of wisdom, lit for a new generation. Read them slowly, say them aloud, and carry one with you today.
          </p>
          <p className="deva mt-6 text-2xl text-accent" lang="sa">
            सत्यमेव जयते
          </p>
        </div>

        <nav aria-label="Explore" className="md:col-span-2">
          <h2 className="eyebrow">Explore</h2>
          <ul className="mt-4 space-y-1 text-sm">
            <li><Link className={linkCls} href="/">Home</Link></li>
            <li><Link className={linkCls} href="/library">Library</Link></li>
            <li><Link className={linkCls} href="/#sloka-of-the-day">Sloka of the Day</Link></li>
            <li><Link className={linkCls} href="/library?favorites=1">Your favorites</Link></li>
            <li><Link className={linkCls} href="/about">About</Link></li>
          </ul>
        </nav>

        <nav aria-label="Sources" className="md:col-span-2">
          <h2 className="eyebrow">Sources</h2>
          <ul className="mt-4 space-y-1 text-sm">
            {SOURCES.map((s) => (
              <li key={s}>
                <Link className={linkCls} href={`/library?source=${encodeURIComponent(s)}`}>{s}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Themes" className="md:col-span-2">
          <h2 className="eyebrow">Themes</h2>
          <ul className="mt-4 space-y-1 text-sm">
            {THEMES.map((t) => (
              <li key={t}>
                <Link className={linkCls} href={`/library?theme=${t}`}>{themeInfo[t].label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-2">
          <h2 className="eyebrow">Accuracy</h2>
          <p className="mt-4 text-sm text-ink-muted">
            Every verse cites its exact source. {pending > 0 ? `${pending} of ${slokas.length} are awaiting final verification against critical editions.` : "All verses have been verified."}
          </p>
          <p className="mt-3 text-sm text-ink-muted">
            Keyboard: press <kbd className="rounded border border-line px-1.5 py-0.5 font-sans text-xs text-ink">/</kbd> to search.
          </p>
        </div>
      </div>

      <div className="relative border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-5 py-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:px-8">
          <p>© {new Date().getFullYear()} VedicSlokas. Verses are in the public domain; translations are our own.</p>
          <a href="#main" className="inline-flex min-h-9 items-center gap-1.5 hover:text-accent">
            Back to top <span aria-hidden="true">↑</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
