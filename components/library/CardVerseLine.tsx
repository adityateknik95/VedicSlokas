"use client";

import { cardLineSize } from "@/lib/akshara";
import { lineInLanguage, useReadingLanguage } from "@/lib/reading-language";

/** A card's first verse line, in the reader's script. */
export function CardVerseLine({ line }: { line: string }) {
  const { text, lang, isDeva } = lineInLanguage(line, useReadingLanguage());
  return (
    <p className={`${isDeva ? "deva" : "indic"} lamp-deva mt-3 [overflow-wrap:anywhere] ${cardLineSize(line, "text-2xl sm:text-[1.7rem]", "text-[1.4rem] sm:text-2xl", "text-[1.3rem] sm:text-[1.4rem]")}`} lang={lang}>
      {text}
    </p>
  );
}
