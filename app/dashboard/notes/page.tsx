import type { Metadata } from "next";
import { ModulePage } from "@/components/dashboard/ModulePage";

export const metadata: Metadata = { title: "Notes" };

/** TODO(notes): build study notes for each sloka here, pass them to ModulePage as children, then flip "notes" to "live" in lib/dashboard/modules.ts. */
export default function Page() {
  return <ModulePage moduleKey="notes" />;
}
