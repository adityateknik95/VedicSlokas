"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { AnimatePresence, LazyMotion, m } from "framer-motion";
import { loadMotionFeatures } from "@/lib/idle";
import { Tilt } from "@/components/ui/Tilt";
import { useReducedMotion } from "@/components/motion/MotionProvider";

export type PillarData = {
  source: string;
  devanagari: string;
  blurb: string;
  detail: string;
  count: number;
  examples: { slug: string; title: string; citation: string }[];
};

export function Pillars({ pillars }: { pillars: PillarData[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const reduced = useReducedMotion();
  const baseId = useId();
  const active = open === null ? null : pillars[open];

  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {pillars.map((p, i) => {
          const isOpen = open === i;
          return (
            <li key={p.source} data-reveal style={{ ["--i" as string]: i }}>
              <Tilt className={`h-full ${isOpen ? "!border-gold shadow-[0_0_40px_-10px_var(--glow)]" : ""}`}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`${baseId}-panel`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex h-full w-full flex-col rounded-[1.25rem] p-6 text-left sm:p-7"
                >
                  <span className="text-xs font-semibold tracking-[0.2em] text-ink-muted">0{i + 1}</span>
                  <span className="deva mt-4 block text-[2.4rem] leading-tight text-accent" lang="sa">
                    {p.devanagari}
                  </span>
                  <span className="display mt-2 block text-3xl text-ink">{p.source}</span>
                  <span className="mt-3 block flex-1 text-sm text-ink-muted">{p.blurb}</span>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-flame">
                    {isOpen ? "Close" : "Know more"}
                    <svg viewBox="0 0 16 16" className={`h-3.5 w-3.5 transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <path d="M8 2v12M2 8h12" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>
              </Tilt>
            </li>
          );
        })}
      </ul>

      <div id={`${baseId}-panel`}>
        <AnimatePresence mode="wait" initial={false}>
          {active && (
            <m.div
              key={active.source}
              initial={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, height: "auto" }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
              transition={{ duration: reduced ? 0.25 : 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-5 grid gap-8 rounded-[1.25rem] border border-gold/50 bg-surface-2 p-6 sm:p-10 md:grid-cols-5">
                <div className="md:col-span-3">
                  <p className="eyebrow">{active.count} slokas in the library</p>
                  <h3 className="display mt-3 text-3xl text-ink sm:text-4xl">{active.source}</h3>
                  <p className="mt-4 text-ink-muted">{active.detail}</p>
                  <Link
                    href={`/library?source=${encodeURIComponent(active.source)}`}
                    className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-semibold text-ink hover:border-gold"
                  >
                    Browse {active.source} <span aria-hidden="true">→</span>
                  </Link>
                </div>
                <div className="md:col-span-2">
                  <p className="eyebrow">Start with</p>
                  <ul className="mt-3 divide-y divide-line">
                    {active.examples.map((ex) => (
                      <li key={ex.slug}>
                        <Link href={`/sloka/${ex.slug}`} className="group flex min-h-14 items-center justify-between gap-3 py-3">
                          <span>
                            <span className="display block text-xl text-ink group-hover:text-accent">{ex.title}</span>
                            <span className="text-xs text-ink-muted">{ex.citation}</span>
                          </span>
                          <span aria-hidden="true" className="text-flame transition-transform group-hover:translate-x-1">→</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
}
