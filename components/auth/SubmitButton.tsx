"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/** Primary submit button. While the form is submitting it's disabled (no double submit) and shows a spinner. */
export function SubmitButton({ children, pendingLabel, disabled = false }: { children: ReactNode; pendingLabel: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-disabled={pending || disabled}
      className="inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-full bg-saffron px-6 text-[0.95rem] font-semibold text-on-saffron shadow-[0_10px_30px_-10px_var(--glow)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#f39a33] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <span className="spinner" aria-hidden="true" />
          <span>{pendingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
