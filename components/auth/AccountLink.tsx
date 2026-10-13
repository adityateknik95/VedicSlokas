"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** Mirrors lib/auth.ts SESSION_HINT_COOKIE (kept as a literal: this file must not import server code). */
const HINT = "vs_signed_in";

const readHint = () => document.cookie.split("; ").some((c) => c === `${HINT}=1`);

const PersonIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="8.5" r="3.6" />
    <path d="M4.5 20c1.2-3.8 4-5.6 7.5-5.6s6.3 1.8 7.5 5.6" />
  </svg>
);

/**
 * The header's one highlighted action: "Log in", or "Dashboard" once signed in.
 * Reads a non-secret hint cookie after hydration, so public pages stay static and nothing
 * calls the server; /dashboard does the real session check. Fixed size, so the swap never
 * shifts layout.
 */
export function AccountLink() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const update = () => setSignedIn(readHint());
    update();
    window.addEventListener("vs-auth-change", update);
    window.addEventListener("focus", update);
    return () => {
      window.removeEventListener("vs-auth-change", update);
      window.removeEventListener("focus", update);
    };
  }, []);

  const label = signedIn ? "Dashboard" : "Log in";
  const ready = signedIn !== null;

  return (
    <Link
      href={signedIn ? "/dashboard" : "/login"}
      aria-label={label}
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-saffron text-sm font-semibold text-on-saffron shadow-[0_8px_24px_-10px_var(--glow)] transition-all duration-300 hover:-translate-y-px hover:bg-[#f39a33] md:h-10 md:w-10 lg:w-[8.25rem] lg:px-4 ${
        ready ? "" : "pointer-events-none opacity-0"
      }`}
    >
      <PersonIcon />
      <span aria-hidden="true" className="hidden lg:inline">
        {label}
      </span>
    </Link>
  );
}
