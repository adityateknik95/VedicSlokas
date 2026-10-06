"use client";

import { useEffect, useRef, useState } from "react";

type State = "idle" | "loading" | "playing" | "paused" | "unavailable";

/** Plays the recitation at `src`. Until the file exists it says so, rather than failing silently. */
export function AudioButton({ src, title }: { src: string; title: string }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<State>("idle");

  useEffect(() => () => audio.current?.pause(), []);

  const toggle = async () => {
    if (state === "unavailable") return;
    if (!audio.current) {
      const a = new Audio();
      a.preload = "none";
      a.src = src;
      a.addEventListener("playing", () => setState("playing"));
      a.addEventListener("pause", () => setState((s) => (s === "unavailable" ? s : "paused")));
      a.addEventListener("ended", () => setState("idle"));
      a.addEventListener("error", () => setState("unavailable"));
      audio.current = a;
    }
    const a = audio.current;
    if (state === "playing") {
      a.pause();
      return;
    }
    setState("loading");
    try {
      await a.play();
    } catch {
      setState("unavailable");
    }
  };

  const label =
    state === "playing" ? "Pause" : state === "loading" ? "Loading…" : state === "unavailable" ? "Recitation coming soon" : state === "paused" ? "Resume" : "Listen";

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={toggle}
        aria-disabled={state === "unavailable"}
        aria-label={state === "playing" ? `Pause recitation of ${title}` : `Play recitation of ${title}`}
        className={`group inline-flex min-h-12 items-center gap-3 rounded-full pl-2 pr-5 text-sm font-semibold transition-all ${
          state === "unavailable" ? "cursor-not-allowed border border-line text-ink-muted" : "bg-saffron text-on-saffron hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-10px_var(--glow)]"
        }`}
      >
        <span className={`grid h-9 w-9 place-items-center rounded-full ${state === "unavailable" ? "bg-surface-2" : "bg-on-saffron/15"}`}>
          {state === "playing" ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4 translate-x-px" fill="currentColor" aria-hidden="true">
              <path d="M7 4.5v15l13-7.5z" />
            </svg>
          )}
        </span>
        <span aria-live="polite">{label}</span>
      </button>
    </div>
  );
}
