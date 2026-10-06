"use client";

import { useRef, type ComponentProps } from "react";

/**
 * A .card that tilts a few degrees toward the pointer. Only reacts to mouse/pen
 * (never touch), and CSS disables the transform under prefers-reduced-motion.
 */
export function Tilt({ className = "", children, max = 5, ...rest }: ComponentProps<"div"> & { max?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    const el = ref.current!;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", `${(px * max * 2).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${(-py * max * 2).toFixed(2)}deg`);
  };
  const reset = () => {
    ref.current?.style.setProperty("--rx", "0deg");
    ref.current?.style.setProperty("--ry", "0deg");
  };

  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={reset} className={`card ${className}`} {...rest}>
      {children}
    </div>
  );
}
