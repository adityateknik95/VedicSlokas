"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AUTH_CHANNEL, TAB_ID, type AuthMessage } from "@/lib/auth-channel";

const PROTECTED = ["/dashboard", "/admin"];

/**
 * Signs out every tab together: when another tab signs out, protected pages here
 * re-validate on the server (and get sent to log in). Also re-checks when a protected
 * tab comes back into view, in case the session ended while it was hidden.
 */
export function AuthSync() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(AUTH_CHANNEL);
      channel.onmessage = (e: MessageEvent<AuthMessage>) => {
        if (e.data.from === TAB_ID) return;
        // Lets the header's AccountLink re-read its hint cookie.
        window.dispatchEvent(new Event("vs-auth-change"));
        if (e.data.type === "signed-out" && isProtected) router.replace("/login?signedOut=1");
      };
    } catch {
      channel = null;
    }
    const onVisible = () => {
      if (!document.hidden && isProtected) router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      channel?.close();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname, router]);

  return null;
}
