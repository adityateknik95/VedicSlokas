"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/**
 * Disclosure popover (button + panel). Escape and clicks outside close it and return focus to
 * the button. Used for the notifications bell and the user menu.
 */
export function Popover({
  label,
  button,
  children,
  panelClassName = "",
}: {
  label: string;
  button: ReactNode;
  children: (close: () => void) => ReactNode;
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (focusBack: boolean) => {
      setOpen(false);
      if (focusBack) trigger.current?.focus();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="grid h-11 min-w-11 place-items-center rounded-full text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink aria-expanded:bg-surface-2 aria-expanded:text-ink"
      >
        {button}
      </button>
      {open && (
        <div id={id} className={`pop-in absolute right-0 top-[calc(100%+0.5rem)] z-50 rounded-2xl border border-line bg-bg-2 shadow-[0_24px_60px_-24px_rgb(0_0_0/0.75)] ${panelClassName}`}>
          {children(() => {
            setOpen(false);
            trigger.current?.focus();
          })}
        </div>
      )}
    </div>
  );
}
