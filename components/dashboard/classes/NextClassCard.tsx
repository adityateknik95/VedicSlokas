import Link from "next/link";
import { Section } from "@/components/dashboard/Section";
import { nextClass } from "@/lib/classes";
import { classWhen } from "@/lib/classes-time";
import { ClassClock } from "./ClassClock";
import { JoinButton } from "./JoinButton";

/** Home: the class on now, or the next one, with Join. Nothing when none is scheduled. */
export async function NextClassCard({ tz, entitled }: { tz: string; entitled: boolean }) {
  const now = Date.now();
  const c = await nextClass(now).catch(() => null);
  if (!c) return null;
  return (
    <Section id="home-next-class" eyebrow="Live class" title={new Date(c.startsAt).getTime() <= now ? "On now" : "Next class"} action={{ href: "/dashboard/classes", label: "Timetable" }}>
      <article className="dash-card dash-enter flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-flame">
            <time dateTime={c.startsAt}>{classWhen(c.startsAt, tz)}</time> · with {c.teacherName}
          </p>
          <h3 className="display mt-1.5 text-3xl text-ink">
            <Link href={`/dashboard/classes/${c.id}`} className="hover:text-accent">
              {c.title}
            </Link>
          </h3>
          <div className="mt-2">
            <ClassClock startsAt={c.startsAt} durationMin={c.durationMin} cancelled={c.cancelled} serverNow={now} />
          </div>
        </div>
        <JoinButton classId={c.id} startsAt={c.startsAt} durationMin={c.durationMin} cancelled={c.cancelled} entitled={entitled} serverNow={now} />
      </article>
    </Section>
  );
}
