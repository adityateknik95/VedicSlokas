"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { CarouselItem } from "./Carousel3D";

const Carousel3D = dynamic(() => import("./Carousel3D"), {
  ssr: false,
  loading: () => <div className="h-[30rem] sm:h-[32rem]" aria-hidden="true" />,
});

/** The 3D carousel's code is fetched only when its section approaches the viewport. */
export function CarouselLazy({ items }: { items: CarouselItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(ref.current!);
    return () => io.disconnect();
  }, []);

  return <div ref={ref}>{near ? <Carousel3D items={items} /> : <div className="h-[30rem] sm:h-[32rem]" aria-hidden="true" />}</div>;
}
