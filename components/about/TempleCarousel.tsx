"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/components/motion/MotionProvider";

const temples = [
  {
    name: "Tirupati",
    deity: "Sri Venkateswara Swamy",
    description: "Seek the blessings of Lord Venkateswara at Tirumala.",
    image: "/temples/tirupati.jpg",
    url: "https://www.tirumala.org/",
    action: "Visit TTD Official Website",
  },
  {
    name: "Dharmasthala",
    deity: "Sri Manjunatheshwara",
    description: "Discover the sacred kshetra of Sri Manjunatha Swamy.",
    image: "/temples/dharmasthala.jpg",
    url: "https://www.shridharmasthala.org/",
    action: "Visit Official Website",
  },
  {
    name: "Sri Padmavathi Ammavari Temple",
    deity: "Sri Padmavathi Ammavaru",
    description: "Seek the blessings of Goddess Padmavathi at the sacred temple in Tiruchanoor.",
    image: "/temples/padmavathi.jpg",
    url: "https://www.tirumala.org/PatAtThiruchanoorTempleLegend.aspx",
    action: "Visit Official Website",
  },
  {
    name: "Mantralayam",
    deity: "Sri Raghavendra Swamy",
    description: "Visit the official Sri Raghavendra Swamy Matha portal.",
    image: "/temples/mantralayam.jpg",
    url: "https://srsmatha.org/",
    action: "Visit Official Website",
  },
];

const INTERVAL_MS = 5000;

export function TempleCarousel() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  // Auto-advance stops for any of these; the visitor can also pause it with the button.
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);

  // Only rotate while the carousel is on screen and the tab is in front.
  useEffect(() => {
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.35 });
    io.observe(sectionRef.current!);
    const onVis = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // Never auto-advance for visitors who ask for reduced motion.
  const autoplay = !reduced && !userPaused;
  const running = autoplay && !hovered && !focused && visible && !tabHidden;

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % temples.length), INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [running]);

  const go = (direction: number) => setActive((current) => (current + direction + temples.length) % temples.length);

  const temple = temples[active];

  return (
    <section
      ref={sectionRef}
      aria-labelledby="temple-carousel-title"
      className="relative overflow-hidden py-16 sm:py-24"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      onTouchStart={() => setUserPaused(true)}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,162,75,0.12),transparent_65%)]"
      />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
          <p className="eyebrow">Sacred destinations</p>
          <h2 id="temple-carousel-title" className="display mt-3 text-4xl text-ink sm:text-5xl">
            Find your divine <span className="text-gold-sheen">darshan</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-ink-muted sm:text-base">
            Explore four revered pilgrimage destinations. Select a slide to visit its official website.
          </p>
        </div>

        <div role="region" aria-roledescription="carousel" aria-label="Sacred destinations" className="relative mx-auto max-w-4xl">
          <a
            key={temple.name}
            href={temple.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-roledescription="slide"
            className="group relative block min-h-[460px] overflow-hidden rounded-[1.6rem] border border-gold/50 bg-bg-2 shadow-[0_24px_70px_-35px_rgba(201,162,75,0.65)] sm:min-h-[540px]"
          >
            {/* The photos are portrait and small, so instead of stretching them across the
                wide frame, a blurred copy fills the frame and the photo sits whole on top at
                close to its natural size. Lazy-loaded so it never competes with the hero. */}
            <Image
              src={temple.image}
              alt=""
              aria-hidden="true"
              fill
              sizes="200px"
              quality={40}
              className="scale-110 object-cover opacity-60 blur-2xl"
            />
            <div className="absolute inset-x-0 top-0 bottom-[38%] sm:bottom-[34%]">
              <Image
                src={temple.image}
                alt={`${temple.deity} at ${temple.name}`}
                fill
                sizes="(max-width: 640px) 90vw, 560px"
                quality={90}
                className="object-contain object-top pt-5 drop-shadow-[0_18px_30px_rgba(0,0,0,0.6)] sm:pt-7"
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
            <div className="absolute inset-0 rounded-[1.6rem] border-[5px] border-transparent transition-colors duration-300 group-hover:border-gold/40" />

            <div className="absolute inset-x-0 bottom-0 p-6 text-center sm:p-10">
              <h3 className="display text-3xl text-white drop-shadow sm:text-5xl">{temple.name}</h3>
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.22em] text-white/85 sm:text-sm">{temple.deity}</p>
              <p className="mx-auto mt-4 max-w-lg text-sm text-white/80 sm:text-base">{temple.description}</p>
              <span className="mx-auto mt-6 inline-flex items-center gap-3 rounded-full border border-[#f5d88b]/80 bg-[#f5d88b] px-6 py-3 text-sm font-semibold text-[#21160b] transition group-hover:bg-white sm:px-8">
                {temple.action}
                <span aria-hidden="true">↗</span>
                <span className="sr-only">(opens in a new tab)</span>
              </span>
            </div>
          </a>

          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous temple"
            className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-gold/50 bg-bg/90 text-ink shadow-lg transition hover:bg-gold hover:text-black sm:-left-6 sm:h-12 sm:w-12"
          >
            <span aria-hidden="true" className="text-2xl leading-none">
              ‹
            </span>
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next temple"
            className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-gold/50 bg-bg/90 text-ink shadow-lg transition hover:bg-gold hover:text-black sm:-right-6 sm:h-12 sm:w-12"
          >
            <span aria-hidden="true" className="text-2xl leading-none">
              ›
            </span>
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          {!reduced && (
            <button
              type="button"
              onClick={() => setUserPaused((p) => !p)}
              aria-label={userPaused ? "Play slideshow" : "Pause slideshow"}
              className="mr-1 grid h-11 w-11 place-items-center rounded-full border border-gold/50 text-ink transition hover:bg-gold hover:text-black"
            >
              {userPaused ? (
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 translate-x-px" fill="currentColor" aria-hidden="true">
                  <path d="M7 4.5v15l13-7.5z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              )}
            </button>
          )}
          <div className="flex items-center" role="group" aria-label="Choose a temple slide">
            {temples.map((item, index) => (
              <button
                key={item.name}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show ${item.name}`}
                aria-current={active === index ? "true" : undefined}
                className="group grid h-11 min-w-11 place-items-center px-1.5"
              >
                {/* The dot stays small; the button around it is a full 44px touch target. */}
                <span
                  aria-hidden="true"
                  className={`block h-2.5 rounded-full transition-all duration-300 ${active === index ? "w-8 bg-gold" : "w-2.5 bg-ink-muted/40 group-hover:bg-gold/70"}`}
                />
              </button>
            ))}
          </div>
        </div>

        <p className="mt-3 text-center text-xs text-ink-muted" aria-live={running ? "off" : "polite"}>
          {active + 1} / {temples.length}
        </p>
      </div>
    </section>
  );
}
