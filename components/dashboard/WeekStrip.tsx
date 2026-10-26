import { shiftDay } from "@/lib/dashboard/streak";

const NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Monday = 0 … Sunday = 6, for a YYYY-MM-DD day. */
function weekday(day: string): number {
  return (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7;
}

/** This week, Monday to Sunday: a filled mark for each day they read, today ringed. */
export function WeekStrip({ activeDays, today }: { activeDays: string[]; today: string }) {
  const active = new Set(activeDays);
  const monday = shiftDay(today, -weekday(today));
  const days = NAMES.map((name, i) => ({ name, day: shiftDay(monday, i) }));
  const count = days.filter((d) => active.has(d.day)).length;
  return (
    <figure>
      <ol aria-label="This week" className="grid grid-cols-7 gap-2">
        {days.map(({ name, day }) => {
          const on = active.has(day);
          const isToday = day === today;
          const future = day > today;
          return (
            <li key={day} className="flex flex-col items-center gap-1.5">
              <span className={`text-[0.68rem] font-semibold uppercase tracking-[0.12em] ${isToday ? "text-ink" : "text-ink-muted"}`}>{name}</span>
              <span
                aria-hidden="true"
                className={`h-8 w-8 rounded-full border ${on ? "border-saffron bg-saffron shadow-[0_0_14px_-2px_var(--glow)]" : future ? "border-dashed border-line" : "border-line"} ${isToday ? "ring-2 ring-gold/60 ring-offset-2 ring-offset-[var(--bg-2)]" : ""}`}
              />
              <span className="sr-only">
                {name}
                {isToday ? " (today)" : ""}: {on ? "read" : future ? "still to come" : "no reading"}
              </span>
            </li>
          );
        })}
      </ol>
      <figcaption className="mt-3 text-xs text-ink-muted">{count === 0 ? "No reading yet this week." : `You read on ${count} ${count === 1 ? "day" : "days"} this week.`}</figcaption>
    </figure>
  );
}
