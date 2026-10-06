"use client";

import { useEffect, useRef, useState } from "react";

type Props = { title: string; text: string; path: string };

const btn =
  "inline-flex min-h-12 items-center gap-2 rounded-full border border-line px-5 text-sm font-semibold text-ink transition-all hover:-translate-y-0.5 hover:border-gold hover:bg-surface-2";

/** Copy the verse, or share the page link (native share sheet where available). */
export function ShareActions({ title, text, path }: Props) {
  const [status, setStatus] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const flash = (msg: string) => {
    setStatus(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus(""), 2500);
  };

  const url = () => new URL(path, window.location.origin).toString();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${text}\n\n${url()}`);
      flash("Sloka copied to clipboard");
    } catch {
      flash("Couldn't copy. Select the text and copy it manually.");
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${title} · VedicSlokas`, text: title, url: url() });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url());
      flash("Link copied, ready to share");
    } catch {
      flash("Couldn't share on this device");
    }
  };

  return (
    <>
      <button type="button" onClick={copy} className={btn}>
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-flame" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <rect x="8" y="8" width="12" height="12" rx="2.5" />
          <path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" />
        </svg>
        Copy
      </button>
      <button type="button" onClick={share} className={btn}>
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-flame" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
          <circle cx="18" cy="5.5" r="2.5" />
          <circle cx="6" cy="12" r="2.5" />
          <circle cx="18" cy="18.5" r="2.5" />
          <path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1" />
        </svg>
        Share
      </button>
      <p role="status" aria-live="polite" className="basis-full text-sm text-accent empty:hidden">
        {status}
      </p>
    </>
  );
}
