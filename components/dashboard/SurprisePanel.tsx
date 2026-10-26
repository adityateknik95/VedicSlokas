"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { failureMessage, meFetch } from "@/lib/dashboard/client";
import type { SurpriseSloka } from "@/lib/dashboard/types";
import { trapTab } from "./focus-trap";

const RECENT_KEY = "vedicslokas:surprise-recent";

function readRecent(): string[] {
  try {
    const v: unknown = JSON.parse(sessionStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 10) : [];
  } catch {
    return [];
  }
}
function remember(slug: string) {
  try {
    sessionStorage.setItem(RECENT_KEY, JSON.stringify([slug, ...readRecent().filter((s) => s !== slug)].slice(0, 10)));
  } catch {
    // Without storage, repeats are still avoided by the server's preference for unseen slokas.
  }
}

type State = { kind: "loading" } | { kind: "ready"; sloka: SurpriseSloka } | { kind: "empty" } | { kind: "error"; message: string };

/**
 * The Surprise me reveal: a modal dialog (focus stays inside, Escape closes, focus returns to
 * the button that opened it). The verse rises in softly; with reduced motion it only fades.
 */
export function SurprisePanel({ returnFocus }: { returnFocus: HTMLElement | null }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState<State>({ kind: "loading" });
  const [round, setRound] = useState(0);

  const draw = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const { sloka } = await meFetch<{ sloka: SurpriseSloka | null }>("/api/me/surprise", { body: { recent: readRecent() } });
      if (!sloka) return setState({ kind: "empty" });
      remember(sloka.slug);
      setState({ kind: "ready", sloka });
      setRound((r) => r + 1);
    } catch (error) {
      setState({ kind: "error", message: failureMessage(error, "find a verse") });
    }
  }, []);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    d.showModal();
    void draw();
    const onClose = () => returnFocus?.focus();
    d.addEventListener("close", onClose);
    return () => d.removeEventListener("close", onClose);
  }, [draw, returnFocus]);

  const close = () => dialog.current?.close();

  return (
    <dialog
      ref={dialog}
      aria-labelledby="surprise-title"
      onKeyDown={trapTab}
      onClick={(e) => {
        if (e.target === dialog.current) close();
      }}
      className="surprise-dialog m-auto w-[min(94vw,40rem)] max-h-[92dvh] overflow-y-auto rounded-[1.75rem] border border-gold/40 bg-bg-2 p-0 text-ink backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <div className="relative p-6 sm:p-9">
        <div className="flex items-center justify-between gap-4">
          <h2 id="surprise-title" className="eyebrow flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M12 2.5l2.3 6.4 6.4 2.3-6.4 2.3L12 19.9l-2.3-6.4-6.4-2.3 6.4-2.3z" />
            </svg>
            A verse for you
          </h2>
          <button type="button" onClick={close} aria-label="Close" className="grid h-11 w-11 place-items-center rounded-full text-ink-muted hover:bg-surface-2 hover:text-ink">
            <span aria-hidden="true" className="text-2xl leading-none">
              ×
            </span>
          </button>
        </div>

        <div className="mt-4 min-h-[19rem]" aria-live="polite" aria-busy={state.kind === "loading"}>
          {state.kind === "loading" && (
            <div className="space-y-4 pt-4" aria-label="Finding a verse">
              <div className="skeleton mx-auto h-10 w-4/5 rounded-xl" />
              <div className="skeleton mx-auto h-10 w-3/5 rounded-xl" />
              <div className="skeleton mx-auto mt-8 h-5 w-2/3 rounded-lg" />
              <div className="skeleton mx-auto h-5 w-1/2 rounded-lg" />
            </div>
          )}
          {state.kind === "ready" && (
            <article key={round} className="surprise-reveal text-center">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-flame">
                {state.sloka.citation}
                {state.sloka.unseen && <span className="ml-2 rounded-full border border-gold/50 px-2 py-0.5 text-[0.6rem] tracking-[0.16em] text-accent">New to you</span>}
              </p>
              <p
                lang={state.sloka.reading?.scriptLang ?? "sa"}
                className={`mt-5 text-[1.55rem] leading-[1.9] text-accent [overflow-wrap:anywhere] sm:text-[2rem] ${state.sloka.reading?.script === "iast" ? "iast" : "deva"}`}
              >
                {(state.sloka.reading?.verse ?? state.sloka.devanagari).split("\n").map((line, i) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                ))}
              </p>
              {state.sloka.reading?.script !== "iast" && (
                <p className="iast mt-3 text-base text-ink-muted sm:text-lg">{state.sloka.iast.replace(/ *\|+ */g, " ").split("\n").join(" · ")}</p>
              )}
              {state.sloka.reading && state.sloka.reading.meaningLang !== "en" ? (
                <>
                  <p className="mx-auto mt-6 max-w-lg text-xl leading-snug text-ink sm:text-2xl">{state.sloka.reading.meaning}</p>
                  <p className="mx-auto mt-2 max-w-lg text-sm text-ink-muted">
                    “{state.sloka.translation}”{!state.sloka.reading.meaningVerified && " · the translation above is a draft"}
                  </p>
                </>
              ) : (
                <p className="display mx-auto mt-6 max-w-lg text-xl leading-snug text-ink sm:text-2xl">“{state.sloka.translation}”</p>
              )}
              <p className="mt-3 text-sm text-ink-muted">{state.sloka.title}</p>
            </article>
          )}
          {state.kind === "empty" && <p className="pt-16 text-center text-ink-muted">The library is empty right now. Please come back soon.</p>}
          {state.kind === "error" && (
            <div className="pt-12 text-center">
              <p className="text-ink">{state.message}</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 border-t border-line pt-6">
          <button
            type="button"
            onClick={() => void draw()}
            disabled={state.kind === "loading"}
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-saffron px-6 text-sm font-semibold text-on-saffron transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {state.kind === "error" ? "Try again" : "Another"} <span aria-hidden="true">↻</span>
          </button>
          {state.kind === "ready" && (
            <>
              <Link
                href={`/sloka/${state.sloka.slug}`}
                onClick={close}
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-line px-5 text-sm font-semibold text-ink hover:border-gold"
              >
                Open full sloka <span aria-hidden="true">→</span>
              </Link>
              <FavoriteButton slug={state.sloka.slug} title={state.sloka.title} />
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}
