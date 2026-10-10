import Link from "next/link";
import type { Sloka } from "@/lib/types";
import { Tilt } from "@/components/ui/Tilt";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { cardLineSize } from "@/lib/akshara";

/** Library / related-verse card. The whole card is a link; the favorite button sits above it. */
export function SlokaCard({ sloka, index = 0, headingLevel = "h3" }: { sloka: Sloka; index?: number; headingLevel?: "h2" | "h3" }) {
  const H = headingLevel;
  const firstLine = sloka.devanagari.split("\n")[0].replace(/[।॥]/g, "").trim();
  return (
    <div data-reveal style={{ ["--i" as string]: index % 6 }} className="h-full">
      <Tilt className="lamp-card group flex h-full flex-col p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[var(--lamp-flame)]">{sloka.source}</p>
          <FavoriteButton slug={sloka.slug} title={sloka.title} size="sm" className="relative z-10 -mr-2 -mt-2" />
        </div>
        <p className={`deva lamp-deva mt-3 [overflow-wrap:anywhere] ${cardLineSize(firstLine, "text-2xl sm:text-[1.7rem]", "text-[1.4rem] sm:text-2xl", "text-[1.3rem] sm:text-[1.4rem]")}`} lang="sa">
          {firstLine}
        </p>
        <H className="display mt-3 text-2xl text-[var(--lamp-ink)]">
          <Link href={`/sloka/${sloka.slug}`} className="after:absolute after:inset-0 after:rounded-[1.25rem] after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-flame focus-visible:after:outline-solid">
            {sloka.title}
          </Link>
        </H>
        <p className="mt-2 flex-1 text-sm text-[var(--lamp-muted)]">{sloka.essence}</p>
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#c9a24b]/40 pt-4">
          <span className="mr-auto text-xs font-medium text-[var(--lamp-muted)]">{sloka.reference.citation}</span>
          {sloka.themes.slice(0, 2).map((t) => (
            <span key={t} className="rounded-full border border-[#e2bf6a]/50 px-2.5 py-0.5 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-[var(--lamp-gold)]">
              {t}
            </span>
          ))}
        </div>
      </Tilt>
    </div>
  );
}
