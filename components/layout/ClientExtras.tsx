"use client";

import dynamic from "next/dynamic";
import { KeyboardShortcuts } from "./KeyboardShortcuts";

// Desktop-only nicety; never part of the initial bundle.
const CursorGlow = dynamic(() => import("@/components/motion/CursorGlow"), { ssr: false });

export function ClientExtras() {
  return (
    <>
      <KeyboardShortcuts />
      <CursorGlow />
    </>
  );
}
