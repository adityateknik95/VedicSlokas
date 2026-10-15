import { lastDays } from "@/lib/dashboard/streak";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * The last 12 weeks, one column per week (Monday on top). Active days are filled lotus dots,
 * quiet days are hollow rings: shape, not colour alone. Every day has a text label, and a
 * one-line summary comes first for screen readers.
 */
export function StreakCalendar({ activeDays, today, weeks = 12 }: { activeDays: string[]; today: string; weeks?: number }) {
  const active = new Set(activeDays);
  // End on today's week; start on the Monday `weeks` weeks back.
  const weekday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7; // 0 = Monday
  const days = lastDays(today, weeks * 7 - (6 - weekday));
  const columns: string[][] = [];
  for (let i = 0; i < days.length; i += 7) columns.push(days.slice(i, i + 7));
  const count = days.filter((d) => active.has(d)).length;
  const fmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

  return (
    <figure>
      <figcaption className="text-sm text-ink-muted">
        Active on <strong className="text-ink">{count}</strong> of the last {days.length} days.
      </figcaption>
      <div className="no-scrollbar mt-4 overflow-x-auto pb-1">
        <div className="flex gap-2">
          <div className="grid grid-rows-7 gap-1.5 pr-1 text-[0.65rem] text-ink-muted" aria-hidden="true">
            {WEEKDAYS.map((d, i) => (
              <span key={d} className="flex h-5 items-center">
                {i % 2 === 0 ? d : ""}
              </span>
            ))}
          </div>
          <ol className="flex gap-1.5" aria-label="Activity by day, last 12 weeks">
            {columns.map((col) => (
              <li key={col[0]}>
                <ol className="grid grid-rows-7 gap-1.5">
                  {col.map((day) => {
                    const on = active.has(day);
                    const isToday = day === today;
                    return (
                      <li key={day} className={`grid h-5 w-5 place-items-center rounded-md ${isToday ? "ring-1 ring-flame ring-offset-1 ring-offset-bg" : ""}`}>
                        <span aria-hidden="true" className={on ? "h-3.5 w-3.5 rounded-full bg-saffron shadow-[0_0_8px_1px_var(--glow)]" : "h-2.5 w-2.5 rounded-full border border-line"} />
                        <span className="sr-only">{`${fmt.format(new Date(`${day}T00:00:00Z`))}: ${on ? "read" : "no reading"}${isToday ? ", today" : ""}`}</span>
                      </li>
                    );
                  })}
                </ol>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <p className="mt-3 flex items-center gap-4 text-xs text-ink-muted" aria-hidden="true">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-saffron" /> Read
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border border-line" /> Quiet day
        </span>
      </p>
    </figure>
  );
}
