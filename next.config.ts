import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Pin the workspace root so a stray lockfile higher up the tree is ignored.
  turbopack: { root: process.cwd() },
  async headers() {
    // Fonts and motifs are content-stable files; rename them if they ever change.
    const immutable = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];
    return [
      { source: "/fonts/:path*", headers: immutable },
      { source: "/motifs/:path*", headers: immutable },
    ];
  },
  experimental: {
    optimizePackageImports: ["framer-motion", "gsap"],
  },
};

export default nextConfig;
