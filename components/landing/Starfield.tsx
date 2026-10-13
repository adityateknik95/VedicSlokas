"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/components/motion/MotionProvider";
import { MOTION_PAUSE_EVENT, isMotionPaused } from "@/lib/motion-pause";

type Star = { x: number; y: number; z: number; r: number; phase: number; speed: number; tint: string };

const TINTS = ["255,246,228", "255,226,180", "214,232,255", "255,214,160"];

/** How many stars this device can comfortably draw. */
function starBudget(width: number, height: number): number {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const lowEnd = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4 || nav.connection?.saveData === true;
  const perStar = lowEnd ? 9000 : 4500;
  return Math.round(Math.min(lowEnd ? 160 : 380, Math.max(70, (width * height) / perStar)));
}

/**
 * The living night sky behind the hero: three depth layers of stars that twinkle softly
 * and drift with the pointer (desktop) and the scroll. Canvas 2D, devicePixelRatio capped
 * at 2. Stops drawing when off screen, when the tab is hidden, or when motion is paused;
 * with reduced motion it paints one still frame.
 */
export default function Starfield({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let stars: Star[] = [];
    let raf = 0;
    let running = false;
    let onScreen = true;
    // Parallax targets (pointer in -1..1, scroll in px) and their eased values.
    let px = 0;
    let py = 0;
    let ex = 0;
    let ey = 0;
    const scrollStart = window.scrollY;

    const seed = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: starBudget(w, h) }, () => {
        const z = Math.random() ** 1.8; // most stars far away, a few close
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          z,
          r: 0.35 + z * 1.35,
          phase: Math.random() * Math.PI * 2,
          speed: 0.4 + Math.random() * 1.2,
          tint: TINTS[Math.floor(Math.random() * TINTS.length)],
        };
      });
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      ex += (px - ex) * 0.05;
      ey += (py - ey) * 0.05;
      const scroll = window.scrollY - scrollStart;
      for (const s of stars) {
        const depth = 0.15 + s.z;
        let x = s.x + ex * 18 * depth;
        let y = s.y + ey * 12 * depth - scroll * 0.12 * depth;
        x = ((x % w) + w) % w;
        y = ((y % h) + h) % h;
        const twinkle = reduced ? 1 : 0.6 + 0.4 * Math.sin(s.phase + (t / 1000) * s.speed);
        const alpha = (0.35 + s.z * 0.65) * twinkle;
        ctx.fillStyle = `rgba(${s.tint},${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.z > 0.82) {
          // The nearest stars get a soft halo.
          ctx.fillStyle = `rgba(${s.tint},${(alpha * 0.12).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(x, y, s.r * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const loop = (t: number) => {
      draw(t);
      raf = requestAnimationFrame(loop);
    };
    const shouldRun = () => onScreen && !document.hidden && !reduced && !isMotionPaused();
    const sync = () => {
      if (shouldRun() && !running) {
        running = true;
        raf = requestAnimationFrame(loop);
      } else if (!shouldRun() && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    };

    seed();
    draw(0);
    setVisible(true);

    const ro = new ResizeObserver(() => {
      seed();
      draw(performance.now());
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    io.observe(canvas);
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      px = (e.clientX / window.innerWidth) * 2 - 1;
      py = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", sync);
    window.addEventListener(MOTION_PAUSE_EVENT, sync);
    sync();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener(MOTION_PAUSE_EVENT, sync);
    };
  }, [reduced]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none transition-opacity duration-[1600ms] ease-out ${visible ? "opacity-100" : "opacity-0"} ${className}`}
    />
  );
}
