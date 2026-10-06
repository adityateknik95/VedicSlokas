"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { whenIdle } from "@/lib/idle";

const Embers = dynamic(() => import("./Embers"), { ssr: false });

/** Ember particles are pure atmosphere: they start only after the page is idle. */
export function HeroFX() {
  const [on, setOn] = useState(false);
  useEffect(() => whenIdle(() => setOn(true)), []);
  return on ? <Embers className="absolute inset-0 h-full w-full" /> : null;
}
