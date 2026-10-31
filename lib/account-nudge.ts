"use client";

import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";

/**
 * Guests are asked for an account only after a moment that gives them a reason: saving a verse,
 * or coming back on another day. Each moment asks once, and never blocks anything.
 */

const SAVE_KEY = "vedicslokas:nudged-saves";
const FIRST_VISIT_KEY = "vedicslokas:first-visit";

const today = () => new Date().toISOString().slice(0, 10);

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Without storage the moment may repeat; it is only a suggestion.
  }
}

/** The first and the third saved verse each offer an account, once. */
export function nudgeAfterGuestSave(savedCount: number): void {
  if (savedCount !== 1 && savedCount !== 3) return;
  const asked = (read(SAVE_KEY) ?? "").split(",").filter(Boolean);
  if (asked.includes(String(savedCount))) return;
  write(SAVE_KEY, [...asked, savedCount].join(","));
  toast(savedCount === 1 ? "Saved on this device." : "3 slokas saved on this device.", {
    ms: 8000,
    action: {
      label: "Keep on every device",
      run: () => window.location.assign(`/signup?callbackUrl=${encodeURIComponent(window.location.pathname)}`),
    },
  });
}

/** True for a guest whose first visit was on an earlier day. False until known. */
export function useReturningVisitor(): boolean {
  const [returning, setReturning] = useState(false);
  useEffect(() => {
    const first = read(FIRST_VISIT_KEY);
    if (!first) write(FIRST_VISIT_KEY, today());
    else setReturning(first !== today());
  }, []);
  return returning;
}
