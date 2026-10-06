import type { MetadataRoute } from "next";
import { slokas } from "@/lib/slokas";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/library", "/about"].map((p) => ({
    url: `${site.url}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.8,
  }));
  return [
    ...pages,
    ...slokas.map((s) => ({ url: `${site.url}/sloka/${s.slug}`, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
