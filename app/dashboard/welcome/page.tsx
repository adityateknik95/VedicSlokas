import type { Metadata } from "next";
import { Onboarding } from "@/components/dashboard/Onboarding";
import { dashboardUser, prefsFor } from "@/lib/dashboard/state";
import { THEMES, themeInfo } from "@/lib/slokas";

export const metadata: Metadata = { title: "Welcome" };

/** First-run onboarding. Short and skippable; Home sends new students here once. */
export default async function WelcomePage() {
  const user = await dashboardUser("/dashboard/welcome");
  const prefs = await prefsFor(user.id);
  const themes = THEMES.map((key) => ({ key, ...themeInfo[key] }));
  return (
    <div className="dash-page py-4 sm:py-8">
      <Onboarding firstName={user.name.trim().split(/\s+/)[0] || "friend"} themes={themes} initialInterests={prefs.interests} />
    </div>
  );
}
