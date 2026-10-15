"use client";

import { useSyncExternalStore } from "react";

/** Tiny toast store: one message at a time, announced politely, with an optional action (Undo). */

export type Toast = { id: number; message: string; tone: "info" | "error"; action?: { label: string; run: () => void } };

let current: Toast | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function toast(message: string, options: { tone?: Toast["tone"]; action?: Toast["action"]; ms?: number } = {}): void {
  clearTimeout(timer);
  current = { id: nextId++, message, tone: options.tone ?? "info", action: options.action };
  emit();
  timer = setTimeout(dismissToast, options.ms ?? (options.action ? 6000 : 4000));
}

export function dismissToast(): void {
  clearTimeout(timer);
  current = null;
  emit();
}

export function useToast(): Toast | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => null,
  );
}
