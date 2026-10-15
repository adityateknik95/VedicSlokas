"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * The public site wears the header, a <main> and the footer. The dashboard brings its own
 * app shell (sidebar, top bar, tab bar and its own <main>), so on /dashboard this steps aside.
 */
export function SiteChrome({ header, footer, children }: { header: ReactNode; footer: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return <>{children}</>;
  return (
    <>
      {header}
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      {footer}
    </>
  );
}
