import type { Metadata } from "next";
import Link from "next/link";
import { Container, Eyebrow } from "@/components/ui";
import { param } from "@/lib/search-params";
import { readUnsubscribeToken } from "@/lib/unsubscribe-token";

export const metadata: Metadata = { title: "Daily emails", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Where "Stop these emails" leads. It asks for one click (so link scanners that open every
 * link can't unsubscribe anyone), then confirms.
 */
export default async function UnsubscribePage({ searchParams }: PageProps<"/unsubscribe">) {
  const sp = await searchParams;
  const token = param(sp.u);
  const valid = Boolean(readUnsubscribeToken(token));
  const done = Boolean(param(sp.done));
  const invalid = Boolean(param(sp.invalid)) || (!done && !valid);

  return (
    <div className="temple-bg pb-16 pt-32 sm:pt-40">
      <Container className="max-w-xl text-center">
        <Eyebrow>Daily sloka email</Eyebrow>
        {done ? (
          <>
            <h1 className="display mt-4 text-4xl text-ink">You won&apos;t get these any more</h1>
            <p className="mt-4 text-ink-muted">The daily sloka email is off. You can turn it back on in Settings whenever you like.</p>
            <Link href="/dashboard/settings" className="mt-8 inline-flex min-h-12 items-center rounded-full border border-line px-6 text-sm font-semibold text-ink hover:border-gold">
              Open Settings
            </Link>
          </>
        ) : invalid ? (
          <>
            <h1 className="display mt-4 text-4xl text-ink">This link doesn&apos;t work</h1>
            <p className="mt-4 text-ink-muted">It may be incomplete. You can turn the daily email off in Settings instead.</p>
            <Link href="/dashboard/settings" className="mt-8 inline-flex min-h-12 items-center rounded-full border border-line px-6 text-sm font-semibold text-ink hover:border-gold">
              Open Settings
            </Link>
          </>
        ) : (
          <>
            <h1 className="display mt-4 text-4xl text-ink">Stop the daily sloka?</h1>
            <p className="mt-4 text-ink-muted">We&apos;ll stop emailing you the sloka of the day. Your account and everything in it stay as they are.</p>
            <form method="post" action={`/api/unsubscribe?u=${encodeURIComponent(token ?? "")}`} className="mt-8">
              <button type="submit" className="inline-flex min-h-12 items-center rounded-full bg-saffron px-6 text-sm font-semibold text-on-saffron">
                Stop these emails
              </button>
            </form>
          </>
        )}
      </Container>
    </div>
  );
}
