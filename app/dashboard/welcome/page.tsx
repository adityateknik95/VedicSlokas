import type { Metadata } from "next";
import { Onboarding } from "@/components/dashboard/Onboarding";
import { dashboardUser, prefsFor } from "@/lib/dashboard/state";
import { getSloka, slokas, THEMES, themeInfo } from "@/lib/slokas";

export const metadata: Metadata = { title: "Welcome" };

/** The first line that is more than the opening Om, without its verse marks. */
function firstLine(text: string): string {
  const lines = text.split("\n").map((l) => l.replace(/[।॥|]/g, "").trim());
  return lines.find((l) => l && !/^(ॐ|oṃ)/i.test(l)) ?? lines[0];
}

/** First-run onboarding. Short and skippable; Home sends new students here once. */
export default async function WelcomePage() {
  const user = await dashboardUser("/dashboard/welcome");
  const prefs = await prefsFor(user.id);
  const themes = THEMES.map((key) => ({ key, ...themeInfo[key] }));
  // A real line for the script preview, from a verse most people know.
  const verse = getSloka("gayatri-mantra") ?? slokas[0];
  const sample = { devanagari: firstLine(verse.devanagari), iast: firstLine(verse.iast) };
  return (
    <div className="dash-page py-4 sm:py-8">
      <Onboarding firstName={user.name.trim().split(/\s+/)[0] || "friend"} themes={themes} initialInterests={prefs.interests} sample={sample} />
    </div>
  );
}
