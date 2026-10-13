"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/components/motion/MotionProvider";
import { cardLineSize } from "@/lib/akshara";

export type CarouselItem = { slug: string; title: string; line: string; citation: string; essence: string };

/**
 * A ring of manuscript cards in 3D space. Drag (mouse or touch) to spin it,
 * let go and it glides to the nearest card. Arrow keys and buttons work too;
 * only the front card is focusable.
 */
export default function Carousel3D({ items }: { items: CarouselItem[] }) {
  const reduced = useReducedMotion();
  const n = items.length;
  const step = 360 / n;

  const stageRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const rot = useRef(0);
  const target = useRef<number | null>(null);
  const vel = useRef(0);
  const raf = useRef(0);
  const drag = useRef<{ x: number; last: number; t: number; moved: number } | null>(null);
  const [active, setActive] = useState(0);
  const [cardW, setCardW] = useState(260);

  useEffect(() => {
    const update = () => setCardW(window.innerWidth < 640 ? 220 : 280);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const radius = Math.round(cardW / 2 / Math.tan(Math.PI / n)) + 40;

  const indexFor = useCallback((r: number) => (((Math.round(-r / step) % n) + n) % n), [n, step]);

  const paint = useCallback(() => {
    if (ringRef.current) ringRef.current.style.transform = `translateZ(${-radius}px) rotateY(${rot.current}deg)`;
    const idx = indexFor(rot.current);
    setActive((a) => (a === idx ? a : idx));
  }, [radius, indexFor]);

  const loop = useCallback(() => {
    if (drag.current) return;
    if (target.current !== null) {
      const diff = target.current - rot.current;
      rot.current += diff * 0.12;
      if (Math.abs(diff) < 0.05) {
        rot.current = target.current;
        target.current = null;
      }
    } else if (Math.abs(vel.current) > 0.05) {
      rot.current += vel.current;
      vel.current *= 0.94;
    } else {
      vel.current = 0;
      target.current = Math.round(rot.current / step) * step;
    }
    paint();
    if (target.current !== null || Math.abs(vel.current) > 0.05) raf.current = requestAnimationFrame(loop);
  }, [paint, step]);

  const kick = useCallback(() => {
    cancelAnimationFrame(raf.current);
    if (reduced) {
      if (target.current !== null) rot.current = target.current;
      else rot.current = Math.round(rot.current / step) * step;
      target.current = null;
      vel.current = 0;
      paint();
      return;
    }
    raf.current = requestAnimationFrame(loop);
  }, [loop, paint, reduced, step]);

  useEffect(() => {
    paint();
    return () => cancelAnimationFrame(raf.current);
  }, [paint]);

  const go = (dir: 1 | -1) => {
    const base = target.current ?? Math.round(rot.current / step) * step;
    target.current = base - dir * step;
    vel.current = 0;
    kick();
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    cancelAnimationFrame(raf.current);
    target.current = null;
    vel.current = 0;
    drag.current = { x: e.clientX, last: e.clientX, t: performance.now(), moved: 0 };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.last;
    d.moved += Math.abs(dx);
    if (d.moved > 6 && !stageRef.current?.hasPointerCapture(e.pointerId)) stageRef.current?.setPointerCapture(e.pointerId);
    const now = performance.now();
    const delta = dx * 0.28;
    rot.current += delta;
    vel.current = delta / Math.max(1, (now - d.t) / 16);
    d.last = e.clientX;
    d.t = now;
    paint();
  };
  const endDrag = () => {
    if (!drag.current) return;
    const moved = drag.current.moved;
    drag.current = null;
    if (moved > 6) {
      // Swallow the click that follows a drag so a card link doesn't open.
      const stop = (ev: Event) => {
        ev.preventDefault();
        ev.stopPropagation();
      };
      stageRef.current?.addEventListener("click", stop, { capture: true, once: true });
      setTimeout(() => stageRef.current?.removeEventListener("click", stop, { capture: true }), 50);
    }
    kick();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    }
  };

  return (
    <div role="region" aria-roledescription="carousel" aria-label="Featured slokas" onKeyDown={onKeyDown}>
      <div
        ref={stageRef}
        className="relative mx-auto h-[25rem] cursor-grab select-none overflow-hidden active:cursor-grabbing sm:h-[27rem]"
        style={{ perspective: "1400px", touchAction: "pan-y" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
      >
        <div ref={ringRef} className="absolute left-1/2 top-1/2 h-0 w-0" style={{ transformStyle: "preserve-3d" }}>
          {items.map((it, i) => {
            const isActive = i === active;
            return (
              <div
                key={it.slug}
                className="absolute"
                style={{
                  width: cardW,
                  height: cardW * 1.3,
                  left: -cardW / 2,
                  top: (-cardW * 1.3) / 2,
                  transform: `rotateY(${i * step}deg) translateZ(${radius}px)`,
                  backfaceVisibility: "hidden",
                }}
                aria-hidden={!isActive}
              >
                <Link
                  href={`/sloka/${it.slug}`}
                  tabIndex={isActive ? 0 : -1}
                  draggable={false}
                  // Lamp-lit card: warm glow from the top over deep plum, bright gold edge.
                  // Colours are fixed (not themed) so the cards glow the same in both themes.
                  className={`card flex h-full flex-col justify-between overflow-hidden !border-[#c9a24b]/70 p-6 transition-[opacity,box-shadow] duration-500 ${
                    isActive
                      ? "opacity-100 !shadow-[0_0_0_1px_rgb(232_137_28/0.5),0_20px_60px_-15px_rgb(232_137_28/0.65),0_0_50px_-10px_rgb(232_137_28/0.45)]"
                      : "opacity-[0.88]"
                  }`}
                  style={{
                    background:
                      "radial-gradient(120% 70% at 50% 0%, rgb(232 137 28 / 0.34), transparent 62%), radial-gradient(90% 60% at 50% 110%, rgb(201 162 75 / 0.18), transparent 70%), linear-gradient(180deg, #34223f 0%, #221631 55%, #1b1228 100%)",
                  }}
                >
                  <span aria-hidden="true" className="pointer-events-none absolute inset-2 rounded-[1rem] border border-[#e2bf6a]/45" />
                  <span className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-[#f5ad5c]">{it.citation}</span>
                  <span
                    className={`deva text-center leading-[1.7] text-[#f4cf74] [overflow-wrap:anywhere] [text-shadow:0_0_18px_rgb(232_137_28/0.45)] ${cardLineSize(it.line, "text-[1.65rem] sm:text-[1.9rem]", "text-[1.4rem] sm:text-[1.6rem]", "text-[1.3rem] sm:text-[1.45rem]")}`}
                    lang="sa"
                  >
                    {it.line}
                  </span>
                  <span>
                    <span className="display block text-2xl text-[#fbf1dc]">{it.title}</span>
                    <span className="mt-1 line-clamp-2 block text-sm text-[#e6d6b4]">{it.essence}</span>
                  </span>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-5">
        <button type="button" onClick={() => go(-1)} aria-label="Previous sloka" className="grid h-12 w-12 place-items-center rounded-full border border-line text-ink transition-colors hover:border-gold hover:text-accent">
          <span aria-hidden="true">←</span>
        </button>
        <p className="min-w-24 text-center text-sm tabular-nums text-ink-muted" aria-live="polite">
          <span className="sr-only">Showing </span>
          {active + 1} / {n}
          <span className="sr-only">: {items[active].title}</span>
        </p>
        <button type="button" onClick={() => go(1)} aria-label="Next sloka" className="grid h-12 w-12 place-items-center rounded-full border border-line text-ink transition-colors hover:border-gold hover:text-accent">
          <span aria-hidden="true">→</span>
        </button>
      </div>
      <p className="mt-3 text-center text-xs text-ink-muted">Drag to turn the wheel · or use ← → keys</p>
    </div>
  );
}
