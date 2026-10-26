"use client";

import { useEffect, useId, useRef, useState } from "react";
import { failureMessage, meFetch } from "@/lib/dashboard/client";

const SAVE_AFTER_MS = 900;
const MAX = 2000;

type Status = "idle" | "saving" | "saved" | "error";

/**
 * A private note on this sloka. Saves on its own a moment after typing stops (and when the
 * box loses focus); an empty note is deleted. Shown as plain text, never as HTML.
 */
export function SlokaNote({ slug, initial }: { slug: string; initial: string }) {
  const id = useId();
  const [text, setText] = useState(initial);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const saved = useRef(initial);
  const timer = useRef<number | undefined>(undefined);

  const save = async (value: string) => {
    window.clearTimeout(timer.current);
    if (value.trim() === saved.current.trim()) return;
    setStatus("saving");
    try {
      await meFetch("/api/me/notes", { method: "PUT", body: { slug, body: value } });
      saved.current = value;
      setStatus("saved");
      setError(null);
    } catch (err) {
      setStatus("error");
      setError(failureMessage(err, "save your note"));
    }
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onChange = (value: string) => {
    setText(value);
    setStatus("idle");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void save(value), SAVE_AFTER_MS);
  };

  const statusText = status === "saving" ? "Saving…" : status === "saved" ? (text.trim() ? "Saved" : "Note removed") : "";

  return (
    <div className="dash-card p-5 text-left sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label htmlFor={id} className="font-semibold text-ink">
          My note
        </label>
        <span className="text-xs text-ink-muted">Only you can see this</span>
      </div>
      <textarea
        id={id}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => void save(text)}
        maxLength={MAX}
        rows={3}
        placeholder="What this verse means to you, how to chant it, when to recite it…"
        aria-describedby={`${id}-status`}
        className="mt-3 w-full resize-y rounded-xl border border-line bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus:border-gold"
      />
      <div id={`${id}-status`} aria-live="polite" className="mt-2 flex min-h-6 flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
        <span>
          {status === "error" ? (
            <span className="text-[#f0a89c]">
              {error}{" "}
              <button type="button" onClick={() => void save(text)} className="font-semibold underline underline-offset-4">
                Try again
              </button>
            </span>
          ) : (
            statusText
          )}
        </span>
        <span aria-hidden="true">
          {text.length}/{MAX}
        </span>
      </div>
    </div>
  );
}
