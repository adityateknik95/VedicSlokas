"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { failureMessage, meFetch } from "@/lib/dashboard/client";
import { toast } from "@/lib/toast";

/** "Mark as learned": instant, rolls back with a message if the server says no. */
export function LearnedToggle({ slug, title, initial, compact = false, refresh = false }: { slug: string; title: string; initial: boolean; compact?: boolean; refresh?: boolean }) {
  const router = useRouter();
  const [learned, setLearned] = useState(initial);
  const [busy, setBusy] = useState(false);

  const flip = async () => {
    const next = !learned;
    setLearned(next);
    setBusy(true);
    try {
      await meFetch("/api/me/progress/learned", { body: { slug, learned: next } });
      toast(next ? `${title} marked as learned.` : `${title} is back to exploring.`);
      if (refresh) router.refresh();
    } catch (error) {
      setLearned(!next);
      toast(failureMessage(error, "update that"), { tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void flip()}
      aria-pressed={learned}
      disabled={busy}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border text-sm font-semibold transition-colors disabled:cursor-wait ${compact ? "px-3" : "px-5"} ${
        learned ? "border-saffron bg-saffron/15 text-ink" : "border-line text-ink hover:border-gold"
      }`}
    >
      <span aria-hidden="true" className={`grid h-5 w-5 place-items-center rounded-full border text-[0.7rem] ${learned ? "border-saffron bg-saffron text-on-saffron" : "border-line"}`}>
        {learned ? "✓" : ""}
      </span>
      {learned ? "Learned" : "Mark as learned"}
      {compact && <span className="sr-only"> {title}</span>}
    </button>
  );
}
