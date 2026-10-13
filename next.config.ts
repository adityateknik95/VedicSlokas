import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy for the auth pages. Allows the app itself, Google sign-in
 * (a top-level redirect, plus Google profile photos) and Cloudflare Turnstile.
 * 'unsafe-inline' scripts are needed for Next.js's inline bootstrap and our theme boot
 * script; moving to a nonce-based policy is a follow-up (see README → Authentication).
 */
const authCsp = [
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

const authHeaders = (referrerPolicy: string) => [
  { key: "Content-Security-Policy", value: authCsp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: referrerPolicy },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cache-Control", value: "no-store, max-age=0" },
];

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
    const strict = authHeaders("strict-origin-when-cross-origin");
    return [
      { source: "/fonts/:path*", headers: immutable },
      { source: "/motifs/:path*", headers: immutable },
      { source: "/login", headers: strict },
      { source: "/signup", headers: strict },
      { source: "/check-email", headers: strict },
      { source: "/dashboard/:path*", headers: strict },
      { source: "/dashboard", headers: strict },
      { source: "/api/auth/:path*", headers: strict },
      { source: "/api/sign-in-status", headers: strict },
      // The confirm page carries a token in its URL: never send it anywhere as a Referer.
      { source: "/auth/:path*", headers: authHeaders("no-referrer") },
    ];
  },
  experimental: {
    optimizePackageImports: ["framer-motion", "gsap"],
  },
};

export default nextConfig;
