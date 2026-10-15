import type { IconName } from "@/lib/dashboard/modules";

/** Line icons for the dashboard, drawn to match the site's lotus and diya motifs. */
const PATHS: Record<IconName, React.ReactNode> = {
  home: (
    <>
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M6.5 10v8.5h11V10" />
      <path d="M10.5 18.5v-4h3v4" />
    </>
  ),
  library: (
    <>
      <path d="M4.5 5.5h5a2.5 2.5 0 0 1 2.5 2.5v11a2 2 0 0 0-2-2h-5.5z" />
      <path d="M19.5 5.5h-5A2.5 2.5 0 0 0 12 8v11a2 2 0 0 1 2-2h5.5z" />
    </>
  ),
  heart: (
    <>
      <path d="M12 3.5c2.6 2.8 3.6 6.2 0 11-3.6-4.8-2.6-8.2 0-11Z" />
      <path d="M12 14.5c1.2-3.6 4-6 7.5-6.5-.2 4.4-3 7-7.5 6.5ZM12 14.5c-1.2-3.6-4-6-7.5-6.5.2 4.4 3 7 7.5 6.5Z" />
      <path d="M5.5 18.5c4 2 9 2 13 0" />
    </>
  ),
  spark: <path d="M12 2.5l2.3 6.4 6.4 2.3-6.4 2.3L12 19.9l-2.3-6.4-6.4-2.3 6.4-2.3z" />,
  progress: (
    <>
      <path d="M12 4a8 8 0 1 0 8 8" />
      <path d="M12 4a8 8 0 0 1 8 8" strokeDasharray="2 3" />
      <path d="M8.5 12.5l2.3 2.3 4.7-5" />
    </>
  ),
  classes: (
    <>
      <rect x="3.5" y="5.5" width="17" height="11" rx="2" />
      <path d="M10.5 9v4l3.5-2z" />
      <path d="M8 20h8" />
    </>
  ),
  notes: (
    <>
      <path d="M6.5 3.5h8l3 3v14h-11z" />
      <path d="M14.5 3.5v3h3" />
      <path d="M9 11h6M9 14h6M9 17h4" />
    </>
  ),
  courses: (
    <>
      <path d="M3.5 9 12 5l8.5 4L12 13z" />
      <path d="M7 11v4.5c2.8 2 7.2 2 10 0V11" />
      <path d="M20.5 9v5" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 19.5c1.4-3.4 4-5 7-5s5.6 1.6 7 5" />
    </>
  ),
};

export function DashIcon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {PATHS[name]}
    </svg>
  );
}
