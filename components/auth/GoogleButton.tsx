"use client";

import { useState } from "react";

type Props = { enabled: boolean; callbackUrl: string; mode: "login" | "signup" };

/** "Continue with Google" (email + profile scopes only). The account is created on first use. */
export function GoogleButton({ enabled, callbackUrl, mode }: Props) {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  const start = async () => {
    if (pending) return;
    setPending(true);
    setFailed(false);
    // Loaded on click: keeps the auth client out of the page's initial JavaScript.
    const { authClient } = await import("@/lib/auth-client");
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: callbackUrl,
      newUserCallbackURL: callbackUrl,
      errorCallbackURL: `/${mode}?error=google`,
    });
    // On success the browser is already navigating to Google.
    if (error) {
      setPending(false);
      setFailed(true);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={start}
        disabled={!enabled || pending}
        aria-describedby={!enabled ? "google-unavailable" : failed ? "google-error" : undefined}
        className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-line bg-[#ffffff] px-6 text-[0.95rem] font-semibold text-[#1f1f1f] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-12px_var(--glow)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <span className="spinner text-[#1f1f1f]" aria-hidden="true" />
        ) : (
          <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
          </svg>
        )}
        <span>{pending ? "Opening Google…" : "Continue with Google"}</span>
      </button>
      {!enabled && (
        <p id="google-unavailable" className="mt-2 text-center text-xs text-ink-muted">
          Google sign-in isn&apos;t switched on yet. Please use your email below.
        </p>
      )}
      {failed && (
        <p id="google-error" role="alert" className="field-error mt-2 text-center text-sm">
          We couldn&apos;t reach Google just now. Please try again, or use your email.
        </p>
      )}
    </div>
  );
}
