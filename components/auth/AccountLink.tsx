"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** Mirrors lib/auth.ts SESSION_HINT_COOKIE (kept as a literal: this file must not import server code). */
const HINT = "vs_signed_in";

const readHint = () => document.cookie.split("; ").some((c) => c === `${HINT}=1`);

/**
 * "Log in" or "Dashboard" in the header. Reads a non-secret hint cookie after hydration,
 * so public pages stay static and nothing calls the server. The real session check
 * happens on /dashboard itself. Fixed size, so swapping the label never shifts layout.
 */
export function AccountLink({ compact = false }: { compact?: boolean }) {
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

  const href = signedIn ? "/dashboard" : "/login";
  const label = signedIn ? "Dashboard" : "Log in";
  const ready = signedIn !== null;

  if (compact) {
    return (
      <Link
        href={href}
        aria-label={ready ? label : "Account"}
        className={`grid h-11 w-11 place-items-center rounded-full border border-line text-accent transition-colors hover:border-gold hover:bg-surface-2 ${ready ? "" : "pointer-events-none opacity-0"}`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="8.5" r="3.6" />
          <path d="M4.5 20c1.2-3.8 4-5.6 7.5-5.6s6.3 1.8 7.5 5.6" />
        </svg>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 w-[7.5rem] items-center justify-center gap-2 rounded-full border border-gold/60 px-4 text-sm font-semibold text-ink transition-all hover:border-gold hover:bg-surface-2 ${ready ? "" : "pointer-events-none opacity-0"}`}
    >
      {label}
    </Link>
  );
}
