import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/** Makes VedicSlokas installable ("Add to Home screen"); it opens on the dashboard, full screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: "VedicSlokas",
    description: "Sanskrit slokas, word by word: read, learn and recite, in your own script.",
    id: "/",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0E0B1F",
    theme_color: "#0E0B1F",
    categories: ["education", "books", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Library", url: "/dashboard/library" },
      { name: "Favourites", url: "/dashboard/favourites" },
    ],
  };
}
