"use client";

import { useState, type ReactNode } from "react";
import { SIDEBAR_COOKIE } from "@/lib/dashboard/shell";
import { Sidebar } from "./Sidebar";
import { SurpriseHost } from "./SurpriseHost";
import { TabBar } from "./TabBar";
import { TopBar, type ShellUser } from "./TopBar";

/**
 * The app shell: sidebar (desktop, collapsible, remembered in a cookie so the server
 * renders the right width with no shift), top bar, content, tab bar (phones), and the
 * Surprise me host that any button can open.
 */
export function DashFrame({ user, initiallyCollapsed, reduceMotion, children }: { user: ShellUser; initiallyCollapsed: boolean; reduceMotion: boolean; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(initiallyCollapsed);
  const [animate, setAnimate] = useState(false);

  const toggle = () => {
    const next = !collapsed;
    setAnimate(true);
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "collapsed" : "expanded"}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <div className="dash" data-sidebar={collapsed ? "collapsed" : "expanded"} data-motion={reduceMotion ? "reduce" : undefined} data-animate={animate ? "" : undefined}>
      <a href="#dash-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[80] focus:rounded-full focus:bg-saffron focus:px-4 focus:py-2 focus:text-on-saffron">
        Skip to content
      </a>
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <div className="dash-column">
        <TopBar user={user} />
        <main id="dash-content" tabIndex={-1} className="dash-main outline-none">
          {children}
        </main>
      </div>
      <TabBar />
      <SurpriseHost />
    </div>
  );
}
