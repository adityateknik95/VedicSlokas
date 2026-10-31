"use client";

import { useSyncExternalStore } from "react";
import { hasSessionHint, meFetch } from "@/lib/dashboard/client";
import { LANGUAGES, type LangCode } from "@/lib/language-list";
import { languageForPrefs, prefsForLanguage } from "@/lib/language-prefs";
import { transliterate, type Script } from "@/lib/transliterate";

/**
 * The one language a visitor reads in, for every public page.
 *
 * Guests: remembered on this device. Signed in: the account's reading preferences win, and a
 * change is saved to them too. Static pages render English first and follow after hydration.
 */

const KEY = "vedicslokas:language";
const EVENT = "vedicslokas:language-change";

const isCode = (v: unknown): v is LangCode => LANGUAGES.some((l) => l.code === v);

let current: LangCode | null = null;
let fetched = false;

function readLocal(): LangCode {
  try {
    const v = localStorage.getItem(KEY);
    return isCode(v) ? v : "en";
  } catch {
    return "en";
  }
}

function store(code: LangCode) {
  current = code;
  try {
    localStorage.setItem(KEY, code);
  } catch {
    // Storage unavailable: the choice lasts for this visit.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  if (!fetched && hasSessionHint()) {
    fetched = true;
    void meFetch<{ prefs: { script: string; meaningLang: string } }>("/api/me/prefs")
      .then(({ prefs }) => store(languageForPrefs(prefs.script, prefs.meaningLang)))
      .catch(() => undefined);
  }
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

const getSnapshot = (): LangCode => current ?? readLocal();

export function setReadingLanguage(code: LangCode): void {
  store(code);
  if (hasSessionHint()) void meFetch("/api/me/prefs", { method: "PATCH", body: prefsForLanguage(code) }).catch(() => undefined);
}

export function useReadingLanguage(): LangCode {
  return useSyncExternalStore(subscribe, getSnapshot, () => "en" as const);
}

/** The language this device last chose (for onboarding's starting point). */
export const deviceLanguage = (): LangCode => readLocal();

/** One line of Devanagari in the reader's script (English and Hindi readers keep Devanagari). */
export function lineInLanguage(devanagari: string, code: LangCode): { text: string; lang: string; isDeva: boolean } {
  const language = LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
  if (language.script === "iast" || language.script === "devanagari") return { text: devanagari, lang: "sa", isDeva: true };
  return { text: transliterate(devanagari, language.script as Script), lang: language.scriptLang, isDeva: false };
}
