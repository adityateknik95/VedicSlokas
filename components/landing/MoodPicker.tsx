"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef, useState } from "react";
import { ShareActions } from "@/components/sloka/ShareActions";
import { MOOD_COPY } from "@/lib/landing-copy";
import type { Theme } from "@/lib/types";

export type MoodVerse = { slug: string; title: string; devanagari: string; iast: string; translation: string; citation: string };
export type MoodOption = { theme: Theme; label: string; devanagari: string };

// The story-image exporter (and html-to-image inside it) loads only when the dialog opens.
const StoryCard = dynamic(() => import("@/components/sloka/StoryCard").then((m) => m.StoryCard), {
  ssr: false,
  loading: () => <div className="h-[30rem]" aria-hidden="true" />,
});

/**
 * "How are you feeling right now?" A real radio group (arrow keys move between moods);
 * picking one brings in a verse from the data, announced politely to screen readers.
 */
export function MoodPicker({ options, verses, byTheme }: { options: MoodOption[]; verses: MoodVerse[]; byTheme: Record<Theme, number[]> }) {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [index, setIndex] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const [storyOpen, setStoryOpen] = useState(false);

  const pool = theme ? byTheme[theme] : [];
  const verse = pool.length ? verses[pool[index % pool.length]] : null;
  const option = options.find((o) => o.theme === theme);

  const openStory = () => {
    setStoryOpen(true);
    dialog.current?.showModal();
  };

  return (
    <div className="mx-auto max-w-4xl">
      <fieldset>
        <legend className="sr-only">{MOOD_COPY.legend}</legend>
        <div className="flex flex-wrap justify-center gap-2.5">
          {options.map((o) => (
            <label
              key={o.theme}
              className="group relative inline-flex min-h-12 cursor-pointer select-none items-center gap-2.5 rounded-full border border-line bg-surface px-5 text-[0.95rem] font-medium text-ink-muted transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:text-ink has-[:checked]:border-saffron has-[:checked]:bg-saffron has-[:checked]:text-on-saffron has-[:checked]:shadow-[0_12px_32px_-12px_var(--glow)] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-flame"
            >
              <input
                type="radio"
                name="mood"
                value={o.theme}
                checked={theme === o.theme}
                onChange={() => {
                  setTheme(o.theme);
                  setIndex(0);
                }}
                className="sr-only"
              />
              <span lang="sa" aria-hidden="true" className="deva text-lg leading-none">
                {o.devanagari}
              </span>
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {verse && option ? MOOD_COPY.announce(option.label, verse.title) : ""}
      </p>

      <div className="mt-10 min-h-[22rem]">
        {verse ? (
          <article key={`${verse.slug}-${index}`} className="verse-in lamp-card card p-6 text-center sm:p-10">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-[var(--lamp-flame)]">{verse.citation}</p>
            <p lang="sa" className="deva lamp-deva mt-5 text-[1.6rem] leading-[1.9] [overflow-wrap:anywhere] sm:text-[2.1rem]">
              {verse.devanagari.split("\n").map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </p>
            <p lang="sa-Latn" className="iast mt-4 text-lg text-[var(--lamp-gold)] sm:text-xl">
              {verse.iast.replace(/ *\|+ */g, " ").split("\n").join(" · ")}
            </p>
            <p className="display mx-auto mt-6 max-w-2xl text-2xl leading-snug text-[var(--lamp-ink)] sm:text-[1.7rem]">“{verse.translation}”</p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIndex((i) => i + 1)}
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-saffron px-6 text-sm font-semibold text-on-saffron transition-transform hover:-translate-y-0.5"
              >
                {MOOD_COPY.another} <span aria-hidden="true">↻</span>
              </button>
              <Link
                href={`/sloka/${verse.slug}`}
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#e2bf6a]/50 px-5 text-sm font-semibold text-[var(--lamp-gold)] hover:border-[#f4cf74]"
              >
                {MOOD_COPY.readFull} <span aria-hidden="true">→</span>
              </Link>
              <button
                type="button"
                onClick={openStory}
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#e2bf6a]/50 px-5 text-sm font-semibold text-[var(--lamp-gold)] hover:border-[#f4cf74]"
              >
                {MOOD_COPY.storyImage}
              </button>
              <div className="flex flex-wrap items-center justify-center gap-3 [&_button]:border-[#e2bf6a]/50 [&_button]:text-[var(--lamp-ink)] [&_p]:text-[var(--lamp-gold)]">
                <ShareActions
                  title={verse.title}
                  text={`${verse.devanagari}\n\n${verse.iast}\n\n“${verse.translation}”\n— ${verse.citation}`}
                  path={`/sloka/${verse.slug}`}
                />
              </div>
            </div>
          </article>
        ) : (
          <div className="grid h-full min-h-[22rem] place-items-center rounded-[1.6rem] border border-dashed border-line px-6 text-center">
            <p className="display text-2xl text-ink-muted">{MOOD_COPY.empty}</p>
          </div>
        )}
      </div>

      <dialog
        ref={dialog}
        aria-labelledby="story-dialog-title"
        onClose={() => setStoryOpen(false)}
        className="m-auto w-[min(92vw,44rem)] rounded-[1.6rem] border border-gold/40 bg-bg-2 p-6 text-ink backdrop:bg-black/70 backdrop:backdrop-blur-sm sm:p-8"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 id="story-dialog-title" className="display text-3xl">
            {MOOD_COPY.storyDialogTitle}
          </h3>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-sm font-semibold hover:border-gold"
          >
            {MOOD_COPY.closeDialog}
          </button>
        </div>
        {storyOpen && verse && (
          <StoryCard slug={verse.slug} title={verse.title} devanagari={verse.devanagari} iast={verse.iast} translation={verse.translation} citation={verse.citation} />
        )}
      </dialog>
    </div>
  );
}
