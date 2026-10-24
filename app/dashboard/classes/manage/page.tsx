import type { Metadata } from "next";
import Link from "next/link";
import { ManageClasses } from "@/components/dashboard/classes/ManageClasses";
import { managedClasses } from "@/lib/classes";
import { hasRole, requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Manage classes" };

/** Teachers schedule and edit their own classes; admins see and edit everyone's. */
export default async function ManageClassesPage() {
  const { user } = await requireRole(["teacher", "admin"], "/dashboard/classes/manage");
  const classes = await managedClasses(user);
  return (
    <div className="space-y-8">
      <Link href="/dashboard/classes" className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-muted hover:text-ink">
        <span aria-hidden="true">←</span> Timetable
      </Link>
      <header>
        <p className="eyebrow">{hasRole(user, ["admin"]) ? "All classes" : "Your classes"}</p>
        <h1 className="display mt-2 text-4xl text-ink sm:text-5xl">Manage classes</h1>
        <p className="mt-3 max-w-2xl text-ink-muted">
          Every class is one hour. Create the meeting in Zoom or Google Meet, paste its link here, and students get a Join button ten minutes before the start. The link is never shown before then.
        </p>
      </header>
      <ManageClasses classes={classes} isAdmin={hasRole(user, ["admin"])} />
    </div>
  );
}
