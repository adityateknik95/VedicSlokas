import Link from "next/link";
import type { Sloka } from "@/lib/types";
import { Tilt } from "@/components/ui/Tilt";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { ThemeTag } from "@/components/ui";
import { cardLineSize } from "@/lib/akshara";

/** Library / related-verse card. The whole card is a link; the favorite button sits above it. */
export function SlokaCard({ sloka, index = 0, headingLevel = "h3" }: { sloka: Sloka; index?: number; headingLevel?: "h2" | "h3" }) {
  const H = headingLevel;
  const firstLine = sloka.devanagari.split("\n")[0].replace(/[।॥]/g, "").trim();
  return (
    <div data-reveal style={{ ["--i" as string]: index % 6 }} className="h-full">
      <Tilt className="group flex h-full flex-col p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <p className="eyebrow !text-[0.65rem]">{sloka.source}</p>
          <FavoriteButton slug={sloka.slug} title={sloka.title} size="sm" className="relative z-10 -mr-2 -mt-2" />
        </div>
        <p className={`deva mt-3 text-accent [overflow-wrap:anywhere] ${cardLineSize(firstLine, "text-2xl sm:text-[1.7rem]", "text-[1.4rem] sm:text-2xl", "text-[1.3rem] sm:text-[1.4rem]")}`} lang="sa">
          {firstLine}
        </p>
        <H className="display mt-3 text-2xl text-ink">
          <Link href={`/sloka/${sloka.slug}`} className="after:absolute after:inset-0 after:rounded-[1.25rem] after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-flame focus-visible:after:outline-solid">
            {sloka.title}
          </Link>
        </H>
        <p className="mt-2 flex-1 text-sm text-ink-muted">{sloka.essence}</p>
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <span className="mr-auto text-xs font-medium text-ink-muted">{sloka.reference.citation}</span>
          {sloka.themes.slice(0, 2).map((t) => (
            <ThemeTag key={t}>{t}</ThemeTag>
          ))}
        </div>
      </Tilt>
    </div>
  );
}
