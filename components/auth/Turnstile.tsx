"use client";

import Script from "next/script";

/**
 * Cloudflare Turnstile hook point. Renders nothing unless a site key is passed (that only
 * happens when TURNSTILE_ENABLED=true). Inside a <form>, the widget adds the hidden
 * "cf-turnstile-response" field that the server verifies in lib/turnstile.ts.
 */
export function Turnstile({ siteKey }: { siteKey?: string }) {
  if (!siteKey) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      <div className="cf-turnstile mt-4 flex justify-center" data-sitekey={siteKey} data-theme="auto" />
    </>
  );
}
