"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { HERO } from "@/lib/landing-copy";
import { whenIdle } from "@/lib/idle";
import { isMotionPaused, restoreMotionPause, setMotionPaused } from "@/lib/motion-pause";

const Starfield = dynamic(() => import("./Starfield"), { ssr: false });

/** The starfield arrives only once the page is idle, after the headline has painted. */
export function HeroSky() {
  const [on, setOn] = useState(false);
  useEffect(() => whenIdle(() => setOn(true)), []);
  return on ? <Starfield className="absolute inset-0 h-full w-full" /> : null;
}

/** Visible control to stop all ambient motion (stars, mandalas, glows). Remembered per device. */
export function MotionToggle() {
  const [paused, setPaused] = useState(false);
  useEffect(() => setPaused(restoreMotionPause()), []);

  return (
    <button
      type="button"
      onClick={() => {
        const next = !isMotionPaused();
        setMotionPaused(next);
        setPaused(next);
      }}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-bg/40 px-4 text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted backdrop-blur-sm transition-colors hover:border-gold hover:text-ink"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
        {paused ? <path d="M7 4.5v15l13-7.5z" /> : <path d="M6 5h4v14H6zM14 5h4v14h-4z" />}
      </svg>
      {paused ? HERO.playMotion : HERO.pauseMotion}
    </button>
  );
}
