"use client";

import Link from "next/link";
import { useSignedInHint } from "@/lib/session-hint";

const PersonIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="8.5" r="3.6" />
    <path d="M4.5 20c1.2-3.8 4-5.6 7.5-5.6s6.3 1.8 7.5 5.6" />
  </svg>
);

const primary =
  "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-saffron px-4 text-sm font-semibold text-on-saffron shadow-[0_8px_24px_-10px_var(--glow)] transition-all duration-300 hover:-translate-y-px hover:bg-[#f39a33]";

/**
 * Account actions in the header. Guests see "Log in" and "Create account"; members see
 * "Dashboard". Reads a non-secret hint cookie after hydration (public pages stay static);
 * /dashboard does the real session check. Fixed width, so the swap never shifts layout.
 */
export function AccountLink() {
  const signedIn = useSignedInHint();
  const ready = signedIn !== null;
  const hidden = ready ? "" : "pointer-events-none opacity-0";

  return (
    <>
      {/* Phones and tablets: one icon. */}
      <Link
        href={signedIn ? "/dashboard" : "/login"}
        aria-label={signedIn ? "Dashboard" : "Log in"}
        className={`${primary} h-11 w-11 px-0 md:h-10 md:w-10 lg:hidden ${hidden}`}
      >
        <PersonIcon />
      </Link>

      {/* Laptops and up: full labels in a fixed-width slot. */}
      <div className={`hidden w-[15.5rem] items-center justify-end gap-1 lg:flex ${hidden}`}>
        {signedIn ? (
          <Link href="/dashboard" className={primary}>
            <PersonIcon />
            Dashboard
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="inline-flex h-10 items-center whitespace-nowrap rounded-full px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-2 hover:text-accent"
            >
              Log in
            </Link>
            <Link href="/signup" className={primary}>
              Create account
            </Link>
          </>
        )}
      </div>
    </>
  );
}
