"use client";

import { useRef, useState } from "react";
import { Mandala } from "@/components/motifs";

type Props = {
  slug: string;
  title: string;
  devanagari: string;
  iast: string;
  translation: string;
  citation: string;
};

const W = 1080;
const H = 1920;
const PREVIEW_SCALE = 0.25;

/**
 * A 1080×1920 (Instagram story) card, shown as a scaled preview and exported as PNG.
 * Colours are fixed to the Night Temple palette so the image looks the same whatever theme is active.
 */
export function StoryCard(props: Props) {
  const node = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const render = async () => {
    const { toBlob } = await import("html-to-image");
    await document.fonts.ready;
    const blob = await toBlob(node.current!, {
      width: W,
      height: H,
      pixelRatio: 1,
      cacheBust: true,
      style: { transform: "none", position: "static" },
    });
    if (!blob) throw new Error("render failed");
    return blob;
  };

  const download = async () => {
    setBusy(true);
    setMsg("");
    try {
      const blob = await render();
      const file = new File([blob], `${props.slug}-vedicslokas.png`, { type: "image/png" });
      // On phones, the share sheet goes straight to Instagram / WhatsApp. Elsewhere, download.
      if (navigator.canShare?.({ files: [file] }) && matchMedia("(pointer: coarse)").matches) {
        try {
          await navigator.share({ files: [file], title: props.title });
          setMsg("Shared!");
          return;
        } catch (e) {
          if ((e as Error).name === "AbortError") return;
        }
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      setMsg("Image saved. Post it to your story!");
    } catch {
      setMsg("Couldn't create the image. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const lines = props.devanagari.split("\n");
  const longest = Math.max(...lines.map((l) => l.length));
  const devaSize = longest > 34 ? 50 : longest > 24 ? 60 : 76;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-10">
      <div
        className="relative shrink-0 overflow-hidden rounded-2xl border border-gold/40 shadow-[0_30px_80px_-30px_var(--glow)]"
        style={{ width: W * PREVIEW_SCALE, height: H * PREVIEW_SCALE }}
      >
        <div
          ref={node}
          aria-hidden="true"
          className="absolute left-0 top-0 flex flex-col items-center overflow-hidden text-center"
          style={{
            width: W,
            height: H,
            transform: `scale(${PREVIEW_SCALE})`,
            transformOrigin: "top left",
            background: "radial-gradient(900px 700px at 50% 30%, #2a1a3a 0%, #0e0b1f 60%), #0e0b1f",
            color: "#f3e7cf",
            padding: "150px 90px 120px",
          }}
        >
          <div style={{ position: "absolute", left: -240, top: 180, width: 1560, height: 1560, color: "#c9a24b", opacity: 0.16 }}>
            <Mandala asImage className="h-full w-full" />
          </div>
          <div style={{ position: "absolute", inset: 36, border: "2px solid rgba(201,162,75,0.45)", borderRadius: 36 }} />
          <div style={{ position: "absolute", inset: 52, border: "1px solid rgba(201,162,75,0.25)", borderRadius: 26 }} />

          <p style={{ position: "relative", fontFamily: "var(--font-inter)", fontSize: 30, letterSpacing: "0.32em", textTransform: "uppercase", color: "#f0a04b", fontWeight: 600 }}>
            {props.citation}
          </p>
          <p style={{ position: "relative", fontFamily: "var(--font-tiro)", fontSize: 120, lineHeight: 1, color: "#d9b45c", marginTop: 70 }}>ॐ</p>

          <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 56, width: "100%" }}>
            <p lang="sa" style={{ fontFamily: "var(--font-tiro)", fontSize: devaSize, lineHeight: 1.75, color: "#f3e7cf" }}>
              {lines.map((l, i) => (
                <span key={i} style={{ display: "block" }}>
                  {l}
                </span>
              ))}
            </p>
            <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: 44, lineHeight: 1.45, color: "#e2c06c" }}>
              {props.iast.split("\n").map((l, i) => (
                <span key={i} style={{ display: "block" }}>
                  {l}
                </span>
              ))}
            </p>
            <div style={{ height: 2, width: 160, background: "#c9a24b", margin: "0 auto", opacity: 0.7 }} />
            <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 50, lineHeight: 1.3, color: "#f3e7cf", fontWeight: 500 }}>“{props.translation}”</p>
          </div>

          <p style={{ position: "relative", fontFamily: "var(--font-cormorant)", fontSize: 54, fontWeight: 600, color: "#f3e7cf" }}>
            Vedic<span style={{ color: "#d9b45c" }}>Slokas</span>
          </p>
        </div>
      </div>

      <div className="max-w-sm text-center sm:text-left">
        <p className="eyebrow">Story card · 1080 × 1920</p>
        <h2 className="display mt-3 text-3xl text-ink sm:text-4xl">Share it to your story</h2>
        <p className="mt-3 text-sm text-ink-muted">A lamp-lit card sized for Instagram and WhatsApp stories. On a phone, it opens the share sheet directly.</p>
        <button
          type="button"
          onClick={download}
          disabled={busy}
          className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-saffron px-6 text-sm font-semibold text-on-saffron transition-all hover:-translate-y-0.5 disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
          </svg>
          {busy ? "Creating image…" : "Download as image"}
        </button>
        <p role="status" aria-live="polite" className="mt-3 min-h-5 text-sm text-accent">
          {msg}
        </p>
      </div>
    </div>
  );
}
