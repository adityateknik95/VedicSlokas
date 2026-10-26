import Link from "next/link";
import { ShareActions } from "@/components/sloka/ShareActions";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import type { Reading } from "@/lib/reading";
import type { Sloka } from "@/lib/types";

type Props = {
  sloka: Sloka;
  dateLabel: string;
  /** The verse in the student's script and language, when they chose other than the default. */
  reading: Reading | null;
  /** Reciters see the transliteration first. */
  reciteFirst: boolean;
  /** The sloka they last opened (if it isn't today's), for "Continue where you left off". */
  continueTo: { slug: string; title: string } | null;
};

/** Sloka of the Day, the same verse everyone reads today (same logic as the public page), the way this student reads. */
export function TodaySloka({ sloka, dateLabel, reading, reciteFirst, continueTo }: Props) {
  const verse = reading && reading.script !== "devanagari" ? reading.verse : sloka.devanagari;
  const verseIsRoman = reading?.script === "iast";
  const iastLine = sloka.iast.replace(/ *\|+ */g, " ").split("\n").join(" · ");
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
      {reciteFirst && !verseIsRoman && <p className="iast mt-5 text-lg leading-relaxed text-[var(--lamp-ink)] sm:text-xl">{iastLine}</p>}
      <p
        lang={reading?.scriptLang ?? "sa"}
        className={`lamp-deva mt-5 text-[1.45rem] leading-[1.85] [overflow-wrap:anywhere] sm:text-[1.8rem] ${verseIsRoman ? "iast" : "deva"}`}
      >
        {verse.split("\n").map((line, i) => (
          <span key={i} className="block">
            {line}
          </span>
        ))}
      </p>
      {reading && reading.meaningLang !== "en" ? (
        <>
          <p className="mt-4 text-lg leading-snug text-[var(--lamp-ink)] sm:text-xl">{reading.meaning}</p>
          <p className="mt-1 text-sm text-[var(--lamp-muted)]">
            “{sloka.translation}”{!reading.meaningVerified && " · draft translation above"}
          </p>
        </>
      ) : (
        <p className="display mt-4 text-lg leading-snug text-[var(--lamp-ink)] sm:text-xl">“{sloka.translation}”</p>
      )}
      <p className="mt-2 text-xs text-[var(--lamp-muted)]">{sloka.reference.citation}</p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href={`/sloka/${sloka.slug}`}
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-saffron px-5 text-sm font-semibold text-on-saffron transition-transform hover:-translate-y-0.5"
        >
          {reciteFirst ? "Recite today's verse" : "Read full sloka"} <span aria-hidden="true">→</span>
        </Link>
        {continueTo && (
          <Link
            href={`/sloka/${continueTo.slug}`}
            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#e2bf6a]/50 px-5 text-sm font-semibold text-[var(--lamp-ink)] hover:border-[#f4cf74]"
          >
            Continue where you left off<span className="sr-only">: {continueTo.title}</span> <span aria-hidden="true">↻</span>
          </Link>
        )}
        {/* The card is always dark: give the shared buttons the card's own lamp colours in both themes. */}
        <div className="flex flex-wrap items-center gap-3 [&_button]:border-[#e2bf6a]/50 [&_button]:text-[var(--lamp-ink)] [&_button:hover]:border-[#f4cf74] [&_p]:text-[var(--lamp-gold)]">
          <ShareActions title={sloka.title} text={copyText} path={`/sloka/${sloka.slug}`} />
        </div>
      </div>
    </section>
  );
}
