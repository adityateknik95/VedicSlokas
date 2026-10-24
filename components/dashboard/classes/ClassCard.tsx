import Link from "next/link";
import type { ClassView } from "@/lib/classes";
import { classWhen } from "@/lib/classes-time";
import { ClassClock } from "./ClassClock";
import { JoinButton } from "./JoinButton";

type Props = { c: ClassView; tz: string; entitled: boolean; serverNow: number; past?: boolean };

/** One class in the timetable: when, what, who, where it stands, and Join (or the recording). */
export function ClassCard({ c, tz, entitled, serverNow, past = false }: Props) {
  return (
    <article aria-labelledby={`class-${c.id}`} className={`dash-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6 ${c.cancelled ? "opacity-70" : ""}`}>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-flame">
          <time dateTime={c.startsAt}>{classWhen(c.startsAt, tz)}</time> · {c.durationMin} min
        </p>
        <h3 id={`class-${c.id}`} className="display mt-1.5 text-2xl text-ink">
          <Link href={`/dashboard/classes/${c.id}`} className="hover:text-accent">
            {c.title}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-ink-muted">with {c.teacherName}</p>
        {c.description && <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{c.description}</p>}
      </div>
      <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
        {!past && <ClassClock startsAt={c.startsAt} durationMin={c.durationMin} cancelled={c.cancelled} serverNow={serverNow} />}
        {past ? (
          c.recordingUrl ? (
            <a href={c.recordingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-semibold text-ink hover:border-gold">
              Watch recording <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <span className="text-sm text-ink-muted">No recording</span>
          )
        ) : (
          <JoinButton classId={c.id} startsAt={c.startsAt} durationMin={c.durationMin} cancelled={c.cancelled} entitled={entitled} serverNow={serverNow} />
        )}
      </div>
    </article>
  );
}
