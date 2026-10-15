import type { Metadata } from "next";
import { ModulePage } from "@/components/dashboard/ModulePage";

export const metadata: Metadata = { title: "Live classes" };

/** TODO(classes): build live classes, the timetable, booking and recordings here, pass them to ModulePage as children, then flip "classes" to "live" in lib/dashboard/modules.ts. */
export default function Page() {
  return <ModulePage moduleKey="classes" />;
}
