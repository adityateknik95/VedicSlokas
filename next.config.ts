import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy for every page. Allows the app itself, Google sign-in (a top-level
 * redirect, plus Google profile photos) and Cloudflare Turnstile; nothing else may load,
 * and no other site may frame us. 'unsafe-inline' scripts are needed for Next.js's inline
 * bootstrap and our theme boot script on static pages (nonces would force every page to be
 * rendered per request); see README → Authentication.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://lh3.googleusercontent.com",
  "font-src 'self'",
  `connect-src 'self' https://challenges.cloudflare.com${isDev ? " ws: wss:" : ""}`,
  "frame-src https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "form-action 'self' https://accounts.google.com",
  "base-uri 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

/** Sent with every response. HSTS comes from Vercel (max-age two years, preload). */
const siteHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

/** Signed-in and auth pages are never cached; a later rule wins for the same header. */
const noStore = [{ key: "Cache-Control", value: "no-store, max-age=0" }];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Quality levels used by the temple carousel (crisp photo, cheap blurred backdrop).
  images: { qualities: [40, 75, 90] },
  // Pin the workspace root so a stray lockfile higher up the tree is ignored.
  turbopack: { root: process.cwd() },
  // Local-only embedded Postgres (WASM); keep it out of the server bundle.
  serverExternalPackages: ["@electric-sql/pglite"],
  async headers() {
    // Fonts and motifs are content-stable files; rename them if they ever change.
    const immutable = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];
    return [
      { source: "/:path*", headers: siteHeaders },
      { source: "/fonts/:path*", headers: immutable },
      { source: "/icons/:path*", headers: immutable },
      // The service worker must always be checked for updates, and may control the whole site.
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, max-age=0" }, { key: "Service-Worker-Allowed", value: "/" }] },
      { source: "/motifs/:path*", headers: immutable },
      { source: "/login", headers: noStore },
      { source: "/signup", headers: noStore },
      { source: "/check-email", headers: noStore },
      { source: "/dashboard/:path*", headers: noStore },
      { source: "/dashboard", headers: noStore },
      { source: "/admin/:path*", headers: noStore },
      { source: "/unsubscribe", headers: noStore },
      { source: "/api/auth/:path*", headers: noStore },
      { source: "/api/sign-in-status", headers: noStore },
      // The confirm page carries a token in its URL: never send it anywhere as a Referer.
      { source: "/auth/:path*", headers: [...noStore, { key: "Referrer-Policy", value: "no-referrer" }] },
    ];
  },
  experimental: {
    optimizePackageImports: ["framer-motion", "gsap"],
  },
};

/**
 * Error monitoring (Sentry). Browser reports are sent to /monitoring on this site and passed
 * on by the server, so the CSP keeps connect-src 'self'. Source maps upload only when
 * SENTRY_AUTH_TOKEN, SENTRY_ORG and SENTRY_PROJECT are set; without them the build is unchanged.
 */
const uploadMaps = Boolean(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT);

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  telemetry: false,
  tunnelRoute: "/monitoring",
  sourcemaps: { disable: !uploadMaps, deleteSourcemapsAfterUpload: true },
  widenClientFileUpload: uploadMaps,
});
