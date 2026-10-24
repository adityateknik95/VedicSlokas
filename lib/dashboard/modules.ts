import type { Feature } from "@/db/schema";

/**
 * Every area of the dashboard, in one typed list. The sidebar, the mobile tab bar and
 * the "coming soon" rail on Home all render from this registry.
 *
 * Adding a feature later (say, Live classes):
 *   1. build its pages under app/dashboard/<route>,
 *   2. flip its entry here: status "soon" -> "live" (keep `requires` if it is paid),
 *   3. make lib/entitlements.ts grant the entitlement to subscribers.
 * Nothing else changes: navigation, gating and the locked state come from here.
 */

export type Entitlement = "liveClasses" | "notes" | "courses";
export type Entitlements = Record<Entitlement, boolean>;

export type ModuleStatus = "live" | "soon";
export type Placement = "sidebar" | "tabBar" | "homeRail";
export type IconName = "home" | "library" | "heart" | "spark" | "progress" | "classes" | "notes" | "courses" | "profile";

export type DashboardModule = {
  key: string;
  label: string;
  /** Shorter label for the mobile tab bar. */
  shortLabel?: string;
  icon: IconName;
  /** Route, or "surprise" for the in-place Surprise me action. */
  href: string | "surprise";
  status: ModuleStatus;
  /** Entitlement needed once live. Missing = free for every signed in student. */
  requires?: Entitlement;
  /** Interest signal recorded by "Notify me" while the module is coming soon. */
  feature?: Feature;
  placements: readonly Placement[];
  /** Sidebar section. */
  group: "learn" | "soon" | "account";
  /** One honest line: what it will be. Shown on cards and module pages. */
  summary?: string;
  /** What is planned, for the module page. No dates, prices or names. */
  planned?: readonly string[];
};

export const MODULES = [
  { key: "home", label: "Home", icon: "home", href: "/dashboard", status: "live", placements: ["sidebar", "tabBar"], group: "learn" },
  { key: "library", label: "Library", icon: "library", href: "/dashboard/library", status: "live", placements: ["sidebar", "tabBar"], group: "learn" },
  { key: "surprise", label: "Surprise me", shortLabel: "Surprise", icon: "spark", href: "surprise", status: "live", placements: ["tabBar"], group: "learn" },
  { key: "favourites", label: "Favourites", icon: "heart", href: "/dashboard/favourites", status: "live", placements: ["sidebar", "tabBar"], group: "learn" },
  { key: "progress", label: "Progress", icon: "progress", href: "/dashboard/progress", status: "live", placements: ["sidebar"], group: "learn" },
  {
    key: "classes",
    label: "Live classes",
    icon: "classes",
    href: "/dashboard/classes",
    status: "live",
    requires: "liveClasses",
    feature: "live_classes",
    placements: ["sidebar"],
    group: "learn",
    summary: "Small live sessions where a teacher chants, explains and answers your questions.",
    planned: ["Join a session from your dashboard, on any device", "Chant along, ask questions as you go", "Watch the recording later if you miss one"],
  },
  {
    key: "notes",
    label: "Notes",
    icon: "notes",
    href: "/dashboard/notes",
    status: "soon",
    requires: "notes",
    feature: "notes",
    placements: ["sidebar", "homeRail"],
    group: "soon",
    summary: "Clear study notes for each sloka, with grammar, context and pronunciation tips.",
    planned: ["Notes that sit beside each sloka you open", "Word roots and grammar, explained simply", "Pronunciation tips for the tricky sounds"],
  },
  {
    key: "courses",
    label: "Courses",
    icon: "courses",
    href: "/dashboard/courses",
    status: "soon",
    requires: "courses",
    feature: "courses",
    placements: ["sidebar", "homeRail"],
    group: "soon",
    summary: "Guided paths through a text, one short lesson at a time, at your own pace.",
    planned: ["Short lessons that build on each other", "Practice with the slokas you are learning", "Pick up where you left off, on any device"],
  },
  { key: "settings", label: "Settings", shortLabel: "Profile", icon: "profile", href: "/dashboard/settings", status: "live", placements: ["sidebar", "tabBar"], group: "account" },
] as const satisfies readonly DashboardModule[];

export type ModuleKey = (typeof MODULES)[number]["key"];

export function getModule(key: ModuleKey): DashboardModule {
  return MODULES.find((m) => m.key === key)!;
}

export function modulesFor(placement: Placement): DashboardModule[] {
  return MODULES.filter((m) => (m.placements as readonly Placement[]).includes(placement));
}

export const NO_ENTITLEMENTS: Entitlements = { liveClasses: false, notes: false, courses: false };

export type ModuleAccess = "open" | "soon" | "locked";

/**
 * What a student can do with a module:
 * - "soon": not built yet (coming soon page, Notify me),
 * - "locked": built, but needs an entitlement this student does not have (upgrade placeholder),
 * - "open": render it.
 */
export function moduleAccess(module: Pick<DashboardModule, "status" | "requires">, entitlements: Entitlements): ModuleAccess {
  if (module.status === "soon") return "soon";
  if (module.requires && !entitlements[module.requires]) return "locked";
  return "open";
}

/** The route a pathname belongs to, for aria-current and the page title. */
export function activeModule(pathname: string): DashboardModule | undefined {
  const routed = MODULES.filter((m) => m.href !== "surprise") as DashboardModule[];
  return routed
    .filter((m) => pathname === m.href || (m.href !== "/dashboard" && pathname.startsWith(`${m.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0];
}
