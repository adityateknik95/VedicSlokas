"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { SURPRISE_EVENT } from "./surprise-events";

const SurprisePanel = dynamic(() => import("./SurprisePanel").then((m) => m.SurprisePanel), { ssr: false });

/** Waits for a Surprise me click, then loads the reveal (its code is not in the page until then). */
export function SurpriseHost() {
  const [openCount, setOpenCount] = useState(0);
  const [returnFocus, setReturnFocus] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const onOpen = () => {
      setReturnFocus(document.activeElement instanceof HTMLElement ? document.activeElement : null);
      setOpenCount((n) => n + 1);
    };
    window.addEventListener(SURPRISE_EVENT, onOpen);
    return () => window.removeEventListener(SURPRISE_EVENT, onOpen);
  }, []);

  if (!openCount) return null;
  return <SurprisePanel key={openCount} returnFocus={returnFocus} />;
}
