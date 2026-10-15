"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Tilt } from "@/components/ui/Tilt";
import { ELEMENTS_COPY, type ElementCopy } from "@/lib/landing-copy";

export type VersePreview = { slug: string; line: string; citation: string };

/** Each element's colour, used for its quality dot and the glow of the open card. */
const COLORS: Record<ElementCopy["key"], string> = {
  space: "#9b8cff",
  air: "#7fc8ff",
  fire: "#ff7a45",
  water: "#cfe3f2",
  earth: "#f2c94c",
};

/**
 * One element card, over a photograph of its element (public/elements). The card always
 * uses the night palette (data-theme) so its text stays light on the photo in either theme;
 * a dark wash keeps it readable, and deepens when the card opens to show its verse.
 *
 * Tap (or Enter/Space) toggles it open on any device; on desktop a hover
 * previews it too. Closed content is inert, so the keyboard never lands on hidden links.
 */
export function ElementCard({ item, verse, index }: { item: ElementCopy; verse: VersePreview | null; index: number }) {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const open = pinned || hovered;
  const panelId = useId();
  const color = COLORS[item.key];

  return (
    <li data-reveal style={{ ["--i" as string]: index, ["--el" as string]: color }} className="h-full">
      <Tilt
        data-theme="night"
        className={`group isolate h-full overflow-hidden !rounded-[1.6rem] text-ink transition-[border-color,box-shadow] duration-500 ${open ? "!border-[color-mix(in_srgb,var(--el)_60%,transparent)] shadow-[0_0_50px_-18px_var(--el)]" : ""}`}
        onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setHovered(false)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/elements/${item.key}.webp`}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          width={600}
          height={1066}
          className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b transition-opacity duration-500 from-[#0e0b1f]/55 via-[#0e0b1f]/70 to-[#0e0b1f]/92 ${open ? "opacity-0" : "opacity-100"}`}
        />
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 -z-10 bg-[#0e0b1f]/80 transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`}
        />
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setPinned((p) => !p)}
          className="flex min-h-[17rem] w-full flex-col items-start justify-end rounded-[1.6rem] p-6 text-left sm:p-7"
        >
          <span lang="sa" className="deva block text-[2.1rem] leading-tight text-accent">
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
