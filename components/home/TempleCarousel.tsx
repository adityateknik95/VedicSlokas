"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

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
    description:
      "Seek the blessings of Goddess Padmavathi at the sacred temple in Tiruchanoor.",
    image: "/temples/padmavathi.jpeg",
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

export function TempleCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;

    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % temples.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [paused]);

  const go = (direction: number) => {
    setActive(
      (current) =>
        (current + direction + temples.length) % temples.length
    );
  };

  const temple = temples[active];

  return (
    <section
      aria-labelledby="temple-carousel-title"
      className="relative overflow-hidden py-16 sm:py-24"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,162,75,0.12),transparent_65%)]"
      />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
          <p className="eyebrow">Sacred destinations</p>

          <h2
            id="temple-carousel-title"
            className="display mt-3 text-4xl text-ink sm:text-5xl"
          >
            Find your divine{" "}
            <span className="text-gold-sheen">darshan</span>
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm text-ink-muted sm:text-base">
            Explore four revered pilgrimage destinations. Select a
            slide to visit its official website.
          </p>
        </div>

        <div className="relative mx-auto max-w-4xl">
          <a
            key={temple.name}
            href={temple.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${temple.name} — ${temple.action} (opens in a new tab)`}
            className="group relative block min-h-[440px] overflow-hidden rounded-[1.6rem] border border-gold/50 bg-bg-2 shadow-[0_24px_70px_-35px_rgba(201,162,75,0.65)] sm:min-h-[500px]"
          >
            <Image
              src={temple.image}
              alt={`${temple.deity} at ${temple.name}`}
              fill
              priority={active === 0}
              sizes="(max-width: 768px) 100vw, 900px"
             
className={`${
  active === 2
    ? "object-cover"
    : "object-cover"
} transition-transform duration-700`}
style={{
  objectPosition: active === 2 ? "center 15%" : "center center",
}}

            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-black/5" />

            <div className="absolute inset-0 border-[5px] border-transparent transition-colors duration-300 group-hover:border-gold/40" />

            <div className="absolute inset-x-0 bottom-0 p-6 text-center sm:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#f5d88b] sm:text-sm">
                {/* Sacred pilgrimage */}
              </p>

              <h3 className="display mt-3 text-3xl text-white drop-shadow sm:text-5xl">
                {temple.name}
              </h3>

              <p className="mt-2 text-xs font-medium uppercase tracking-[0.22em] text-white/85 sm:text-sm">
                {temple.deity}
              </p>

              <p className="mx-auto mt-4 max-w-lg text-sm text-white/80 sm:text-base">
                {temple.description}
              </p>

              <span className="mx-auto mt-6 inline-flex items-center gap-3 rounded-full border border-[#f5d88b]/80 bg-[#f5d88b] px-6 py-3 text-sm font-semibold text-[#21160b] transition hover:bg-white sm:px-8">
                {temple.action}
                <span aria-hidden="true">↗</span>
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

        <div
          className="mt-6 flex items-center justify-center gap-3"
          aria-label="Choose a temple slide"
        >
          {temples.map((item, index) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show ${item.name}`}
              aria-current={active === index ? "true" : undefined}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                active === index
                  ? "w-8 bg-gold"
                  : "w-2.5 bg-ink-muted/40 hover:bg-gold/70"
              }`}
            />
          ))}
        </div>

        <p className="mt-3 text-center text-xs text-ink-muted">
          {active + 1} / {temples.length}
        </p>
      </div>
    </section>
  );
}
