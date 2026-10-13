import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = { title: "Sign-in cancelled" };

export default function NotMePage() {
  return (
    <AuthShell eyebrow="All clear" title="Thanks for telling us">
      <div className="space-y-5 text-ink-muted">
        <p>We&apos;ve cancelled that sign-in link, so it can&apos;t be used. Nobody was signed in.</p>
        <p>Someone may have typed your address by mistake. There&apos;s nothing else you need to do.</p>
        <Link
          href="/"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-line px-6 font-semibold text-ink transition-colors hover:border-gold hover:bg-surface-2"
        >
          Back to VedicSlokas
        </Link>
      </div>
    </AuthShell>
  );
}
