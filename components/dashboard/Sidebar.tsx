"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Diya } from "@/components/motifs";
import { activeModule, modulesFor, type DashboardModule } from "@/lib/dashboard/modules";
import { DashIcon } from "./DashIcon";

const GROUPS: { key: DashboardModule["group"]; label: string }[] = [
  { key: "learn", label: "Learn" },
  { key: "soon", label: "Coming soon" },
  { key: "account", label: "You" },
];

/** Desktop navigation, rendered from the module registry. Collapses to an icon rail. */
export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const active = activeModule(pathname);
  const items = modulesFor("sidebar");

  return (
    <aside className="dash-sidebar" aria-label="Dashboard">
      <Link href="/dashboard" className="dash-brand" aria-label="VedicSlokas dashboard home">
        <Diya className="h-9 w-9 shrink-0" />
        <span className="dash-label display text-2xl tracking-wide text-ink">
          Vedic<span className="text-accent">Slokas</span>
        </span>
      </Link>

      <nav aria-label="Dashboard sections" id="dash-nav" className="mt-6 flex-1 overflow-y-auto overflow-x-hidden">
        {GROUPS.map((group) => {
          const list = items.filter((m) => m.group === group.key);
          if (!list.length) return null;
          return (
            <div key={group.key} className="mb-5">
              <p className="dash-label mb-2 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-ink-muted">{group.label}</p>
              <ul className="space-y-1">
                {list.map((m) => {
                  const current = active?.key === m.key;
                  return (
                    <li key={m.key}>
                      <Link
                        href={m.href}
                        aria-current={current ? "page" : undefined}
                        title={collapsed ? m.label : undefined}
                        className="dash-nav-link group"
                      >
                        <DashIcon name={m.icon} className="h-5 w-5 shrink-0" />
                        <span className="dash-label flex-1 truncate">{m.label}</span>
                        {m.status === "soon" && <span className="dash-label rounded-full border border-line px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-ink-muted">Soon</span>}
                        {collapsed && <span className="sr-only">{m.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-line pt-3">
        <Link href="/" className="dash-nav-link" title={collapsed ? "Back to the public site" : undefined}>
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 6H6.5A1.5 1.5 0 0 0 5 7.5v10A1.5 1.5 0 0 0 6.5 19h10a1.5 1.5 0 0 0 1.5-1.5V14" />
            <path d="M13 5h6v6M19 5l-8 8" />
          </svg>
          <span className="dash-label flex-1">Public site</span>
          {collapsed && <span className="sr-only">Public site</span>}
        </Link>
        <button type="button" onClick={onToggle} aria-expanded={!collapsed} aria-controls="dash-nav" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="dash-nav-link w-full">
          <svg viewBox="0 0 24 24" className={`h-5 w-5 shrink-0 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          <span className="dash-label flex-1 text-left">Collapse</span>
        </button>
      </div>
    </aside>
  );
}
