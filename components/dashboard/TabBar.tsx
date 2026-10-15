"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeModule, modulesFor } from "@/lib/dashboard/modules";
import { DashIcon } from "./DashIcon";
import { openSurprise } from "./surprise-events";

/** Phones: five tabs from the registry, Surprise me raised in the middle. */
export function TabBar() {
  const pathname = usePathname();
  const active = activeModule(pathname);
  return (
    <nav aria-label="Dashboard" className="dash-tabbar md:hidden">
      <ul className="grid grid-cols-5 items-end">
        {modulesFor("tabBar").map((m) => {
          const label = m.shortLabel ?? m.label;
          if (m.href === "surprise") {
            return (
              <li key={m.key} className="flex justify-center">
                <button type="button" onClick={openSurprise} className="dash-tab-surprise" aria-label="Surprise me with a sloka">
                  <DashIcon name={m.icon} className="h-6 w-6" />
                  <span className="text-[0.65rem] font-semibold" aria-hidden="true">
                    {label}
                  </span>
                </button>
              </li>
            );
          }
          const current = active?.key === m.key;
          return (
            <li key={m.key}>
              <Link href={m.href} aria-current={current ? "page" : undefined} className="dash-tab">
                <DashIcon name={m.icon} className="h-5 w-5" />
                <span className="text-[0.65rem] font-medium">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
