import Link from "next/link";
import { Container, SectionHeading } from "@/components/ui";
import { Tilt } from "@/components/ui/Tilt";
import { STREAMS_COPY } from "@/lib/landing-copy";
import { SOURCES, slokas, sourceInfo } from "@/lib/slokas";

const ENDS = [125, 375, 625, 875];
const river = (x: number) => `M500 28 C500 120 ${x} 110 ${x} 236`;

/** Scene five: four rivers of text flowing from one source. */
export function Streams() {
  return (
    <section aria-labelledby="streams-title" className="defer-render relative overflow-hidden py-24 sm:py-32">
      <Container className="max-w-7xl">
        <SectionHeading id="streams-title" eyebrow={STREAMS_COPY.eyebrow} title={STREAMS_COPY.title} lede={STREAMS_COPY.lede} />

        {/* One source, four rivers (desktop). The rivers draw themselves, then a slow current flows. */}
        <div data-reveal aria-hidden="true" className="relative mx-auto -mb-2 hidden lg:block">
          <svg viewBox="0 0 1000 240" className="draw h-auto w-full" fill="none" strokeLinecap="round">
            <defs>
              <linearGradient id="river" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffd28a" />
                <stop offset="100%" stopColor="#4fb6c2" />
              </linearGradient>
              <radialGradient id="source">
                <stop offset="0%" stopColor="#fff6e4" />
                <stop offset="45%" stopColor="#ffc277" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#ffc277" stopOpacity="0" />
              </radialGradient>
            </defs>
            {ENDS.map((x) => (
              <path key={x} pathLength={1} d={river(x)} stroke="url(#river)" strokeOpacity="0.55" strokeWidth="1.6" />
            ))}
            {ENDS.map((x) => (
              <path key={`flow-${x}`} d={river(x)} stroke="#fff2d0" strokeOpacity="0.7" strokeWidth="1.6" strokeDasharray="2 22" className="river-flow" />
            ))}
            <circle cx="500" cy="28" r="26" fill="url(#source)" />
            <circle cx="500" cy="28" r="4" fill="#fff6e4" />
          </svg>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SOURCES.map((source, i) => {
            const info = sourceInfo[source];
            const count = slokas.filter((s) => s.source === source).length;
            return (
              <li key={source} data-reveal style={{ ["--i" as string]: i }}>
                <Tilt className="h-full !rounded-[1.6rem]">
                  <Link href={`/library?source=${encodeURIComponent(source)}`} className="group flex h-full flex-col rounded-[1.6rem] p-6 sm:p-7">
                    <span aria-hidden="true" className="mx-auto mb-4 hidden h-2 w-2 rounded-full bg-teal-300 shadow-[0_0_14px_3px_rgb(79_182_194/0.6)] lg:block" />
                    <span lang="sa" className="deva text-[2.1rem] leading-tight text-accent">
                      {info.devanagari}
                    </span>
                    <span className="display mt-1 text-[1.75rem] text-ink">{source}</span>
                    <span className="mt-3 flex-1 text-sm leading-relaxed text-ink-muted">{info.blurb}</span>
                    <span className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4 text-sm">
                      <span className="text-ink-muted">{STREAMS_COPY.count(count)}</span>
                      <span className="inline-flex items-center gap-1.5 font-semibold text-flame">
                        {STREAMS_COPY.explore(source)}
                        <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </span>
                    </span>
                  </Link>
                </Tilt>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
