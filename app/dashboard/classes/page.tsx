import type { Metadata } from "next";
import { Suspense } from "react";
import { ClassTimetable } from "@/components/dashboard/classes/ClassTimetable";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { SectionSkeleton } from "@/components/dashboard/Section";
import { dashboardUser, entitlementsFor, prefsFor } from "@/lib/dashboard/state";
import { safeTimeZone } from "@/lib/dashboard/streak";
import { hasRole } from "@/lib/session";

export const metadata: Metadata = { title: "Live classes" };

/** The timetable. Classes run on Zoom or Google Meet; Join opens ten minutes before each starts. */
export default async function Page() {
  const user = await dashboardUser("/dashboard/classes");
  const [prefs, entitlements] = await Promise.all([prefsFor(user.id), entitlementsFor(user.id)]);
  return (
    <ModulePage moduleKey="classes">
      <Suspense fallback={<SectionSkeleton title="classes" height="h-64" />}>
        <ClassTimetable tz={safeTimeZone(prefs.timezone)} entitled={entitlements.liveClasses} canManage={hasRole(user, ["teacher", "admin"])} />
      </Suspense>
    </ModulePage>
  );
}
