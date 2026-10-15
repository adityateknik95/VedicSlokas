import Link from "next/link";
import { ShareActions } from "@/components/sloka/ShareActions";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import type { Sloka } from "@/lib/types";

/** Sloka of the Day, the same verse everyone reads today (same logic as the public page). */
export function TodaySloka({ sloka, dateLabel }: { sloka: Sloka; dateLabel: string }) {
  const copyText = `${sloka.devanagari}\n\n${sloka.iast}\n\n“${sloka.translation}”\n(${sloka.reference.citation})`;
  return (
    <section aria-labelledby="today-title" className="lamp-card dash-enter relative overflow-hidden p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-[var(--lamp-flame)]">Sloka of the Day · {dateLabel}</p>
          <h2 id="today-title" className="display mt-1 text-2xl text-[var(--lamp-ink)]">
            {sloka.title}
          </h2>
        </div>
        <FavoriteButton slug={sloka.slug} title={sloka.title} size="sm" className="-mr-1 -mt-1" />
      </div>
      <p lang="sa" className="deva lamp-deva mt-5 text-[1.45rem] leading-[1.85] [overflow-wrap:anywhere] sm:text-[1.8rem]">
        {sloka.devanagari.split("\n").map((line, i) => (
          <span key={i} className="block">
            {line}
          </span>
        ))}
      </p>
      <p className="display mt-4 text-lg leading-snug text-[var(--lamp-ink)] sm:text-xl">“{sloka.translation}”</p>
      <p className="mt-2 text-xs text-[var(--lamp-muted)]">{sloka.reference.citation}</p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href={`/sloka/${sloka.slug}`}
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-saffron px-5 text-sm font-semibold text-on-saffron transition-transform hover:-translate-y-0.5"
        >
          Read full sloka <span aria-hidden="true">→</span>
        </Link>
        {/* The card is always dark: give the shared buttons the card's own lamp colours in both themes. */}
        <div className="flex flex-wrap items-center gap-3 [&_button]:border-[#e2bf6a]/50 [&_button]:text-[var(--lamp-ink)] [&_button:hover]:border-[#f4cf74] [&_p]:text-[var(--lamp-gold)]">
          <ShareActions title={sloka.title} text={copyText} path={`/sloka/${sloka.slug}`} />
        </div>
      </div>
    </section>
  );
}
