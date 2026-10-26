"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * The last resort, when even the root layout failed. It replaces the whole document, so it
 * carries its own minimal styles (the site's CSS may not have loaded). Reports the error.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const button = { minHeight: 48, padding: "0 24px", borderRadius: 999, fontWeight: 600, fontSize: 15, cursor: "pointer" } as const;
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#0e0b1f", color: "#f3e7cf", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ maxWidth: 440, padding: 24, textAlign: "center" }}>
          <p lang="sa" style={{ fontSize: 32, color: "#d9b45c", margin: 0 }}>
            क्षम्यताम्
          </p>
          <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: 32, margin: "12px 0 8px" }}>Something went wrong</h1>
          <p style={{ color: "#cbbd9f", margin: "0 0 24px", lineHeight: 1.5 }}>We&apos;ve been told about it. Please try again in a moment.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button type="button" onClick={reset} style={{ ...button, border: "none", background: "#e8891c", color: "#1a0f05" }}>
              Try again
            </button>
            {/* A full reload: the app's router may be what broke. */}
            <a href="/" style={{ ...button, display: "inline-flex", alignItems: "center", border: "1px solid rgb(201 162 75 / 0.4)", color: "#f3e7cf", textDecoration: "none" }}>
              Go to the home page
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
