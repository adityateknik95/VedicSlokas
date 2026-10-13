"use client";

import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import { Tilt } from "@/components/ui/Tilt";
import { ELEMENTS_COPY, type ElementCopy } from "@/lib/landing-copy";

export type VersePreview = { slug: string; line: string; citation: string };

/** The traditional tattva yantras: Ākāśa an egg, Vāyu a circle, Agni a triangle, Jala a crescent, Pṛthvī a square. */
const GLYPHS: Record<ElementCopy["key"], { color: string; shape: ReactNode }> = {
  space: { color: "#9b8cff", shape: <ellipse cx="32" cy="32" rx="15" ry="20" /> },
  air: { color: "#7fc8ff", shape: <circle cx="32" cy="32" r="17" /> },
  fire: { color: "#ff7a45", shape: <path d="M32 13 L51 47 L13 47 Z" /> },
  water: { color: "#cfe3f2", shape: <path d="M15 24 A17 17 0 0 0 49 24 A13 13 0 0 1 15 24 Z" /> },
  earth: { color: "#f2c94c", shape: <rect x="16" y="16" width="32" height="32" rx="1.5" /> },
};

/**
 * One element card. Tap (or Enter/Space) toggles it open on any device; on desktop a hover
 * previews it too. Closed content is inert, so the keyboard never lands on hidden links.
 */
export function ElementCard({ item, verse, index }: { item: ElementCopy; verse: VersePreview | null; index: number }) {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const open = pinned || hovered;
  const panelId = useId();
  const glyph = GLYPHS[item.key];

  return (
    <li data-reveal style={{ ["--i" as string]: index, ["--el" as string]: glyph.color }} className="h-full">
      <Tilt
        className={`h-full !rounded-[1.6rem] transition-[border-color,box-shadow] duration-500 ${open ? "!border-[color-mix(in_srgb,var(--el)_60%,transparent)] shadow-[0_0_50px_-18px_var(--el)]" : ""}`}
        onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setHovered(false)}
      >
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setPinned((p) => !p)}
          className="flex w-full flex-col items-start rounded-[1.6rem] p-6 text-left sm:p-7"
        >
          <span className="flex w-full items-start justify-between gap-3">
            <svg viewBox="0 0 64 64" className="h-14 w-14" fill="none" stroke={glyph.color} strokeWidth="1.6" aria-hidden="true">
              <circle cx="32" cy="32" r="30" stroke="currentColor" className="text-line" strokeWidth="0.8" />
              <g style={{ filter: `drop-shadow(0 0 6px ${glyph.color})` }}>{glyph.shape}</g>
            </svg>
            <span className="rounded-full border border-line px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-ink-muted">
              {open ? ELEMENTS_COPY.close : ELEMENTS_COPY.open}
            </span>
          </span>
          <span lang="sa" className="deva mt-5 block text-[2.1rem] leading-tight text-accent">
            {item.devanagari}
          </span>
          <span className="display mt-1 block text-[1.7rem] text-ink">
            {item.name} <span className="text-ink-muted">· {item.english}</span>
          </span>
          <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-flame">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--el)]" />
            {item.quality}
          </span>
        </button>

        <div id={panelId} inert={!open} className={`grid transition-[grid-template-rows] duration-500 ease-out-expo ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
          <div className="overflow-hidden">
            <div className="space-y-4 px-6 pb-6 sm:px-7 sm:pb-7">
              <p className="iast text-lg leading-snug text-ink">{item.line}</p>
              {verse && (
                <Link href={`/sloka/${verse.slug}`} className="block rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-gold">
                  <span lang="sa" className="deva block text-xl leading-relaxed text-accent">
                    {verse.line}
                  </span>
                  <span className="mt-1 block text-xs text-ink-muted">{verse.citation}</span>
                </Link>
              )}
              <Link href={`/library?theme=${item.theme}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-accent underline-offset-4 hover:underline">
                {ELEMENTS_COPY.more(item.quality)} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </Tilt>
    </li>
  );
}
