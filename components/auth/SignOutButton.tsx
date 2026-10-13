"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { signOut } from "@/app/(auth)/actions";
import { broadcastAuth } from "@/lib/auth-channel";

/** Revokes the session on the server first; only then tells every other open tab and moves on. */
export function SignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onClick = () =>
    startTransition(async () => {
      await signOut();
      broadcastAuth("signed-out");
      window.dispatchEvent(new Event("vs-auth-change"));
      router.replace("/login?signedOut=1");
    });

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-full border border-line px-6 text-[0.95rem] font-semibold text-ink transition-colors hover:border-gold hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <span className="spinner" aria-hidden="true" />
          Signing out…
        </>
      ) : (
        "Sign out"
      )}
    </button>
  );
}
