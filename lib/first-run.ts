"use client";

import { THEMES, type Theme } from "@/lib/types";

/** What a guest picked on the home page's first-run card. Kept on this device; onboarding starts from it. */

const KEY = "vedicslokas:first-run";

export type FirstRun = { theme: Theme | null; dismissed: boolean };

export function readFirstRun(): FirstRun {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "{}") as { theme?: unknown; dismissed?: unknown };
    return { theme: (THEMES as readonly unknown[]).includes(v.theme) ? (v.theme as Theme) : null, dismissed: v.dismissed === true };
  } catch {
    return { theme: null, dismissed: false };
  }
}

export function writeFirstRun(next: FirstRun): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // The card simply asks again next time.
  }
}
