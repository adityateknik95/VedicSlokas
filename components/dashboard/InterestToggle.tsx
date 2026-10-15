"use client";

import { useState } from "react";
import type { Feature } from "@/db/schema";
import { failureMessage, meFetch } from "@/lib/dashboard/client";
import { toast } from "@/lib/toast";

/** "Notify me" for a coming-soon module. Records interest so we know what to build first. */
export function InterestToggle({ feature, label, initial }: { feature: Feature; label: string; initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);

  const flip = async () => {
    const next = !on;
    setOn(next);
    setBusy(true);
    try {
      await meFetch("/api/me/interest", { body: { feature, on: next } });
      toast(next ? `Noted. We will let you know when ${label} opens.` : `Okay, no updates about ${label}.`);
    } catch (error) {
      setOn(!next);
      toast(failureMessage(error, "save that"), { tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void flip()}
      aria-pressed={on}
      disabled={busy}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors disabled:cursor-wait ${
        on ? "border-saffron bg-saffron/15 text-ink" : "border-line text-ink hover:border-gold"
      }`}
    >
      <span aria-hidden="true" className={`grid h-5 w-5 place-items-center rounded-full border text-[0.7rem] ${on ? "border-saffron bg-saffron text-on-saffron" : "border-line"}`}>
        {on ? "✓" : ""}
      </span>
      {on ? "You'll be notified" : "Notify me"}
      <span className="sr-only"> about {label}</span>
    </button>
  );
}
