import type { Metadata } from "next";
import { ModulePage } from "@/components/dashboard/ModulePage";

export const metadata: Metadata = { title: "Courses" };

/** TODO(courses): build courses and lessons here, pass them to ModulePage as children, then flip "courses" to "live" in lib/dashboard/modules.ts. */
export default function Page() {
  return <ModulePage moduleKey="courses" />;
}
