import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClassClock } from "@/components/dashboard/classes/ClassClock";
import { JoinButton } from "@/components/dashboard/classes/JoinButton";
import { getClass } from "@/lib/classes";
import { classWhen } from "@/lib/classes-time";
import { dashboardUser, entitlementsFor, prefsFor } from "@/lib/dashboard/state";
import { safeTimeZone } from "@/lib/dashboard/streak";

export const metadata: Metadata = { title: "Live class" };

/**
 * One class, with a large clock: the teacher can keep this open (or share it on screen) to
 * see the last 15 minutes count down. Students get the same view and the Join button.
 */
export default async function ClassPage({ params }: PageProps<"/dashboard/classes/[id]">) {
  const { id } = await params;
  const user = await dashboardUser(`/dashboard/classes/${id}`);
  const c = /^[0-9a-f-]{36}$/i.test(id) ? await getClass(id) : null;
  if (!c) notFound();
  const [prefs, entitlements] = await Promise.all([prefsFor(user.id), entitlementsFor(user.id)]);
  const tz = safeTimeZone(prefs.timezone);
  const now = Date.now();

  return (
    <div className="space-y-8">
      <Link href="/dashboard/classes" className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-muted hover:text-ink">
        <span aria-hidden="true">←</span> All classes
      </Link>
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-flame">
          <time dateTime={c.startsAt}>{classWhen(c.startsAt, tz)}</time> · {c.durationMin} min · with {c.teacherName}
        </p>
        <h1 className="display mt-2 text-4xl text-ink sm:text-5xl">{c.title}</h1>
        {c.description && <p className="mt-3 max-w-2xl whitespace-pre-line text-ink-muted">{c.description}</p>}
      </header>
      <section aria-label="Class time" className="dash-card flex flex-col items-start gap-6 p-6 sm:p-10">
        <ClassClock startsAt={c.startsAt} durationMin={c.durationMin} cancelled={c.cancelled} serverNow={now} size="lg" />
        <JoinButton classId={c.id} startsAt={c.startsAt} durationMin={c.durationMin} cancelled={c.cancelled} entitled={entitlements.liveClasses} serverNow={now} size="lg" />
        {c.recordingUrl && (
          <a href={c.recordingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-semibold text-ink hover:border-gold">
            Watch recording <span aria-hidden="true">↗</span>
          </a>
        )}
        <p className="text-sm text-ink-muted">The class opens on Zoom or Google Meet in a new tab. Keep this page open to see the time left.</p>
      </section>
    </div>
  );
}
