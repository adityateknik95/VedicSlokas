import { Fragment } from "react";
import { splitAksharas } from "@/lib/akshara";

type Props = { text: string; className?: string; startMs?: number; stepMs?: number };

/**
 * Devanagari that reveals one akṣara at a time with pure CSS, so it starts
 * before any JavaScript loads. Screen readers get the whole verse at once.
 */
export function AksharaReveal({ text, className = "", startMs = 250, stepMs = 70 }: Props) {
  let n = 0;
  return (
    <p className={`deva ${className}`} lang="sa">
      <span className="sr-only">{text.replace(/\n/g, " ")}</span>
      {text.split("\n").map((line, li) => (
        <span key={li} className="block" aria-hidden="true">
          {line.split(" ").map((word, wi, words) => (
            <Fragment key={wi}>
              <span className="inline-block whitespace-nowrap">
                {splitAksharas(word).map((a, ai) => (
                  <span key={ai} className="akshara" style={{ ["--d" as string]: startMs + n++ * stepMs }}>
                    {a}
                  </span>
                ))}
              </span>
              {wi < words.length - 1 && " "}
            </Fragment>
          ))}
        </span>
      ))}
    </p>
  );
}
