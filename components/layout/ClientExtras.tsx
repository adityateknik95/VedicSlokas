"use client";

import { Toaster } from "@/components/ui/Toaster";
import { CommandPalette } from "./CommandPalette";
import { ServiceWorker } from "./ServiceWorker";

export function ClientExtras() {
  return (
    <>
      <CommandPalette />
      <ServiceWorker />
      <Toaster />
    </>
  );
}
