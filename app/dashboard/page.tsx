import type { Metadata } from "next";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Mandala } from "@/components/motifs";
import { Container, Eyebrow } from "@/components/ui";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };
// Always rendered per request: it depends on who is signed in.
export const dynamic = "force-dynamic";

/**
 * Placeholder that proves auth works end to end.
 * TODO(payments): show the student's plan and billing once subscriptions exist.
 * TODO(classes): live classes, recordings and notes go here.
 * TODO(favorites): offer to copy this device's saved favorites (localStorage) into the account.
 */
export default async function DashboardPage() {
  const { user } = await requireUser("/dashboard");
  const firstName = user.name.trim().split(/\s+/)[0] || "friend";

  return (
    <div className="temple-bg relative min-h-[80dvh] overflow-hidden pb-16 pt-32 sm:pt-40">
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-24 h-[34rem] w-[34rem] text-gold opacity-[0.1]">
        <Mandala variant="simple" className="spin-slow h-full w-full" />
      </div>
      <Container className="relative max-w-3xl">
        <Eyebrow>Your dashboard</Eyebrow>
        <h1 className="display mt-4 text-5xl text-ink sm:text-6xl">Namaste, {firstName}</h1>
        <p className="mt-3 text-ink-muted">
          Signed in as <strong className="break-all text-ink">{user.email}</strong>
        </p>

        <section aria-labelledby="plan-title" className="lamp-card card mt-10 p-7 sm:p-9">
          <h2 id="plan-title" className="display text-3xl text-[var(--lamp-ink)]">
            No active plan yet
          </h2>
          <p className="mt-3 text-[var(--lamp-muted)]">
            Live classes, recordings and notes will appear here once you join a plan. Until then, the whole library is open to you.
          </p>
          <Link
            href="/library"
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#e2bf6a]/50 px-5 text-sm font-semibold text-[var(--lamp-gold)] hover:border-[#f4cf74]"
          >
            Explore the library <span aria-hidden="true">→</span>
          </Link>
        </section>

        <div className="mt-10 max-w-xs">
          <SignOutButton />
        </div>
      </Container>
    </div>
  );
}
