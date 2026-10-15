import { SkeletonBlock } from "@/components/dashboard/Section";

/** Shown while a dashboard page streams in: same shapes as the page, so nothing jumps. */
export default function DashboardLoading() {
  return (
    <div className="dash-page space-y-8" role="status" aria-label="Loading">
      <div aria-hidden="true" className="skeleton h-12 w-72 rounded-xl" />
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <SkeletonBlock className="h-80" />
        <SkeletonBlock className="h-80" />
      </div>
      <SkeletonBlock className="h-44" />
    </div>
  );
}
