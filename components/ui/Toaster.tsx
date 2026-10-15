"use client";

import { dismissToast, useToast } from "@/lib/toast";

/** Announces toasts politely (role="status") and keeps them above the mobile tab bar. */
export function Toaster() {
  const t = useToast();
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="pointer-events-none fixed inset-x-0 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-[70] flex justify-center px-4 md:bottom-6">
      {t && (
        <div
          key={t.id}
          className={`toast-in pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-[0_20px_50px_-20px_rgb(0_0_0/0.7)] backdrop-blur-md ${
            t.tone === "error" ? "border-[#e0796a]/60 bg-bg-2/95 text-ink" : "border-gold/40 bg-bg-2/95 text-ink"
          }`}
        >
          {t.tone === "error" && (
            <span aria-hidden="true" className="text-[#f0a090]">
              !
            </span>
          )}
          <span className="flex-1">{t.message}</span>
          {t.action && (
            <button
              type="button"
              onClick={() => {
                t.action?.run();
                dismissToast();
              }}
              className="min-h-11 shrink-0 rounded-full px-3 font-semibold text-flame hover:bg-surface-2"
            >
              {t.action.label}
            </button>
          )}
          <button type="button" onClick={dismissToast} aria-label="Dismiss" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-surface-2 hover:text-ink">
            <span aria-hidden="true">×</span>
          </button>
        </div>
      )}
    </div>
  );
}
