"use client";

import { useEffect, useState } from "react";

/** Mirrors lib/auth.ts SESSION_HINT_COOKIE (a literal: client code must not import server modules). */
const HINT = "vs_signed_in";

/**
 * Whether this browser is probably signed in, read from a non-secret hint cookie after
 * hydration. `null` until known. Static pages use it to swap labels without a server call;
 * protected pages always do the real session check.
 */
export function useSignedInHint(): boolean | null {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    const read = () => setSignedIn(document.cookie.split("; ").some((c) => c === `${HINT}=1`));
    read();
    window.addEventListener("vs-auth-change", read);
    window.addEventListener("focus", read);
    return () => {
      window.removeEventListener("vs-auth-change", read);
      window.removeEventListener("focus", read);
    };
  }, []);
  return signedIn;
}
