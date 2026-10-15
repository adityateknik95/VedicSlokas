"use client";

import { Toaster } from "@/components/ui/Toaster";
import { KeyboardShortcuts } from "./KeyboardShortcuts";

export function ClientExtras() {
  return (
    <>
      <KeyboardShortcuts />
      <Toaster />
    </>
  );
}
