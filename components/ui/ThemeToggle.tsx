"use client";

import { useEffect, useState } from "react";

type Theme = "night" | "parchment";
export const THEME_KEY = "vedicslokas:theme";
const COLORS: Record<Theme, string> = { night: "#0E0B1F", parchment: "#F3E7CF" };

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme((document.documentElement.dataset.theme as Theme) || "night");
  }, []);

  const toggle = () => {
    const next: Theme = theme === "parchment" ? "night" : "parchment";
    document.documentElement.dataset.theme = next;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", COLORS[next]);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {}
    setTheme(next);
  };

  const isNight = theme !== "parchment";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isNight ? "Switch to Parchment (light) theme" : "Switch to Night Temple (dark) theme"}
      title={isNight ? "Parchment theme" : "Night Temple theme"}
      className="grid h-11 w-11 place-items-center rounded-full border border-line text-accent transition-colors hover:border-gold hover:bg-surface-2"
    >
      {isNight ? (
        // Sun over a scroll: Parchment
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" strokeLinecap="round" />
        </svg>
      ) : (
        // Crescent: Night Temple
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
