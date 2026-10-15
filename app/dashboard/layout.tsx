import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { AccountSync } from "@/components/dashboard/AccountSync";
import { DashFrame } from "@/components/dashboard/DashFrame";
import { SIDEBAR_COOKIE } from "@/lib/dashboard/shell";
import { dashboardUser, favouritesFor, prefsFor } from "@/lib/dashboard/state";
import { hasRole } from "@/lib/session";
import { canUseSubscriptions } from "@/lib/subscriptions";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s · Dashboard · VedicSlokas" }, robots: { index: false, follow: false }, alternates: { canonical: null } };
// Per request: everything here depends on who is signed in.
export const dynamic = "force-dynamic";

/**
 * The signed-in app. proxy.ts already bounced visitors without a session cookie; this
 * validates the session for real (requireUser) before anything renders.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await dashboardUser("/dashboard");
  const [jar, prefs, favourites] = await Promise.all([cookies(), prefsFor(user.id), favouritesFor(user.id)]);

  return (
    <DashFrame
      user={{ name: user.name, email: user.email, image: user.image ?? null, plan: canUseSubscriptions(user), admin: hasRole(user, ["admin"]) }}
      initiallyCollapsed={jar.get(SIDEBAR_COOKIE)?.value === "collapsed"}
      reduceMotion={prefs.motion === "reduce"}
    >
      <AccountSync favourites={favourites} timezone={prefs.timezone} />
      {children}
    </DashFrame>
  );
}
