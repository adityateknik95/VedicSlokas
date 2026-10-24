import { EmptyState, Section } from "@/components/dashboard/Section";
import { timetable } from "@/lib/classes";
import { ClassCard } from "./ClassCard";

/** Live now, coming up (next 30 days) and recent classes with their recordings. */
export async function ClassTimetable({ tz, entitled, canManage }: { tz: string; entitled: boolean; canManage: boolean }) {
  const now = Date.now();
  const { now: live, upcoming, past } = await timetable(now);
  const manage = canManage ? { href: "/dashboard/classes/manage", label: "Manage classes" } : undefined;

  if (live.length + upcoming.length + past.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyState deva="कक्षा" title="No classes scheduled yet" body="The first live classes are being planned. They will appear here, with a Join button that opens ten minutes before each one starts." cta={manage} />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {live.length > 0 && (
        <Section id="classes-live" title="Live now" action={manage}>
          <div className="space-y-3">
            {live.map((c) => (
              <ClassCard key={c.id} c={c} tz={tz} entitled={entitled} serverNow={now} />
            ))}
          </div>
        </Section>
      )}
      <Section id="classes-upcoming" title="Coming up" eyebrow={`Times in ${tz.replace(/_/g, " ")}`} action={live.length ? undefined : manage}>
        {upcoming.length ? (
          <div className="space-y-3">
            {upcoming.map((c) => (
              <ClassCard key={c.id} c={c} tz={tz} entitled={entitled} serverNow={now} />
            ))}
          </div>
        ) : (
          <p className="dash-card p-5 text-sm text-ink-muted">Nothing scheduled in the next 30 days yet.</p>
        )}
      </Section>
      {past.length > 0 && (
        <Section id="classes-past" title="Recent classes">
          <div className="space-y-3">
            {past.map((c) => (
              <ClassCard key={c.id} c={c} tz={tz} entitled={entitled} serverNow={now} past />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
