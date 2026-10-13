"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/components/motion/MotionProvider";

/**
 * One image of the static descent. It sits just below the hero, inside the browser's own
 * lazy loading distance, so a plain lazy image would download during first paint even
 * though most visitors get the 3D version and never see it. Instead it loads only when
 * it is really needed: on screen (the 3D upgrade did not happen), or, for visitors who
 * prefer reduced motion and always get this version, a little before it scrolls in.
 * Until then the figure still carries its alt text; without JavaScript, <noscript> shows it.
 */
export function DescentStill({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || show) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: reduced ? "600px 0px" : "0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, show]);

  return (
    <figure ref={ref} className="descent-still">
      {show ? (
        <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 60rem, 92vw" className="descent-still-img object-cover" />
      ) : (
        <div role="img" aria-label={alt} className="h-full w-full" />
      )}
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" decoding="async" className="h-full w-full object-cover" />
      </noscript>
    </figure>
  );
}
