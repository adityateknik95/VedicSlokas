import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "@/components/dashboard/Avatar";
import { DataControls } from "@/components/dashboard/settings/DataControls";
import { PreferencesForm } from "@/components/dashboard/settings/PreferencesForm";
import { ProfileForm } from "@/components/dashboard/settings/ProfileForm";
import { signInMethods } from "@/lib/dashboard/data";
import { dashboardUser, prefsFor } from "@/lib/dashboard/state";
import { THEMES, themeInfo } from "@/lib/slokas";

export const metadata: Metadata = { title: "Settings" };

function Panel({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="dash-card dash-enter p-6 sm:p-8">
      <h2 id={id} className="dash-section-title mb-6">
        {title}
      </h2>
      {children}
    </section>
  );
}

const METHOD_LABEL = { google: "Google", "email-link": "Email link" } as const;

/** Profile, preferences, privacy and data. */
export default async function SettingsPage() {
  const user = await dashboardUser("/dashboard/settings");
  const [prefs, methods] = await Promise.all([prefsFor(user.id), signInMethods(user.id)]);
  const themes = THEMES.map((key) => ({ key, label: themeInfo[key].label, devanagari: themeInfo[key].devanagari }));

  return (
    <div className="dash-page max-w-3xl space-y-6">
      <header className="dash-enter mb-2">
        <h1 className="display text-4xl text-ink sm:text-5xl">Settings</h1>
      </header>

      <Panel id="profile-title" title="Profile">
        <div className="mb-6 flex items-center gap-4">
          <Avatar name={user.name} image={user.image ?? null} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-ink">{user.name}</p>
            <p className="truncate text-sm text-ink-muted">{user.email}</p>
          </div>
        </div>
        <ProfileForm name={user.name} />
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-ink">Email</dt>
            <dd className="mt-1 break-all text-sm text-ink-muted">{user.email}</dd>
            <dd className="text-xs text-ink-muted">Your sign-in address. It can&apos;t be changed here.</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-ink">Signs in with</dt>
            <dd className="mt-1 flex flex-wrap gap-2">
              {methods.map((m) => (
                <span key={m} className="rounded-full border border-line px-3 py-1 text-xs font-medium text-ink">
                  {METHOD_LABEL[m]}
                </span>
              ))}
            </dd>
          </div>
        </dl>
      </Panel>

      <Panel id="prefs-title" title="Preferences">
        <PreferencesForm prefs={{ interests: prefs.interests, dailyEmail: prefs.dailyEmail, timezone: prefs.timezone, motion: prefs.motion }} themes={themes} />
      </Panel>

      <Panel id="data-title" title="Privacy and data">
        <DataControls email={user.email} />
        <p className="mt-8 border-t border-line pt-5 text-sm text-ink-muted">
          Read our{" "}
          <Link href="/terms" className="font-semibold text-flame underline-offset-4 hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-semibold text-flame underline-offset-4 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </Panel>
    </div>
  );
}
