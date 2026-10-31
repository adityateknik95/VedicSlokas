"use client";

import { SlokaNote } from "./SlokaNote";
import { useSlokaAccount } from "./useSlokaAccount";

/**
 * Below the verse, for signed-in readers only: their private note.
 */
export function SlokaPersonal({ slug }: { slug: string }) {
  const state = useSlokaAccount(slug);
  if (!state) return null;
  return (
    <div className="mx-auto mt-10 grid max-w-3xl gap-4">
      <SlokaNote slug={slug} initial={state.note?.body ?? ""} />
    </div>
  );
}
