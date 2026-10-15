import Link from "next/link";
import type { Summary } from "@/lib/dashboard/summaries";

/** Small card for strips and lists: source, the first Devanagari line, the title. */
export function CompactSlokaCard({ sloka, note, index = 0 }: { sloka: Summary; note?: string; index?: number }) {
  return (
    <Link
      href={`/sloka/${sloka.slug}`}
      style={{ ["--i" as string]: index }}
      className="dash-card dash-card-hover dash-enter flex h-full min-h-[9.5rem] flex-col p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame"
    >
      <span className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-flame">{sloka.source}</span>
      <span lang="sa" className="deva mt-2 line-clamp-2 text-lg leading-snug text-accent [overflow-wrap:anywhere]">
        {sloka.firstLine}
      </span>
      <span className="mt-auto pt-3 font-semibold leading-snug text-ink">{sloka.title}</span>
      {note && <span className="mt-1 text-xs text-ink-muted">{note}</span>}
    </Link>
  );
}
