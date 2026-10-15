"use client";

import { openSurprise } from "./surprise-events";

/** The big, friendly Surprise me button on Home. Opens the reveal in place. */
export function SurpriseLauncher() {
  return (
    <button
      type="button"
      onClick={openSurprise}
      className="group inline-flex min-h-14 items-center gap-3 rounded-full bg-saffron px-7 text-base font-semibold text-on-saffron shadow-[0_14px_34px_-14px_var(--glow)] transition-transform duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 transition-transform duration-500 group-hover:rotate-180" fill="currentColor" aria-hidden="true">
        <path d="M12 2.5l2.3 6.4 6.4 2.3-6.4 2.3L12 19.9l-2.3-6.4-6.4-2.3 6.4-2.3z" />
      </svg>
      Surprise me
    </button>
  );
}
