import type { Metadata } from "next";
import Link from "next/link";
import { ManageClasses } from "@/components/dashboard/classes/ManageClasses";
import { googleLinkFor } from "@/lib/class-meetings";
import { managedClasses } from "@/lib/classes";
import { isGoogleEnabled } from "@/lib/env";
import { param } from "@/lib/search-params";
import { hasRole, requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Manage classes" };

/** Teachers schedule and edit their own classes; admins see and edit everyone's. */
export default async function ManageClassesPage({ searchParams }: PageProps<"/dashboard/classes/manage">) {
  const { user } = await requireRole(["teacher", "admin"], "/dashboard/classes/manage");
  const [classes, link, sp] = await Promise.all([managedClasses(user), googleLinkFor(user.id), searchParams]);
  return (
    <div className="space-y-8">
      <Link href="/dashboard/classes" className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-muted hover:text-ink">
        <span aria-hidden="true">←</span> Timetable
      </Link>
      <header>
        <p className="eyebrow">{hasRole(user, ["admin"]) ? "All classes" : "Your classes"}</p>
        <h1 className="display mt-2 text-4xl text-ink sm:text-5xl">Manage classes</h1>
        <p className="mt-3 max-w-2xl text-ink-muted">
          Every class is one hour. Pick a date and time and the site makes the Google Meet link (or paste your own Zoom or Meet link). Students get a Join button ten minutes before the start; the link is never shown before then.
        </p>
      </header>
      <ManageClasses
        classes={classes}
        isAdmin={hasRole(user, ["admin"])}
        google={{ email: link?.email ?? null, available: isGoogleEnabled() }}
        notice={param(sp.google) ?? null}
      />
    </div>
  );
}
