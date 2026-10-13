import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResendTimer } from "@/components/auth/ResendTimer";
import { SignInWatcher } from "@/components/auth/SignInWatcher";
import { safeCallbackUrl } from "@/lib/redirects";
import { param } from "@/lib/search-params";
import { currentAttempt } from "@/lib/sign-in-attempts";

export const metadata: Metadata = { title: "Check your inbox" };

/**
 * The waiting room after a link is sent. The address comes from the requesting browser's
 * own httpOnly attempt cookie, never from the URL, so it can't leak via links or logs.
 */
export default async function CheckEmailPage({ searchParams }: PageProps<"/check-email">) {
  const sp = await searchParams;
  const callbackUrl = safeCallbackUrl(param(sp.callbackUrl));
  const attempt = await currentAttempt();

  if (!attempt || attempt.expired) {
    return (
      <AuthShell eyebrow="Sign in" title="Nothing waiting here">
        <p className="text-ink-muted">This sign-in request has expired or was started in another browser.</p>
        <Link
          href="/login"
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-saffron px-6 font-semibold text-on-saffron transition-transform hover:-translate-y-0.5"
        >
          Send me a sign in link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow="Almost there" title="Check your inbox">
      <div className="space-y-6">
        <p className="text-ink-muted">
          If an account can use this address, we&apos;ve sent a link to <strong className="break-all text-ink">{attempt.email}</strong>. Open it
          and press <strong className="text-ink">Confirm sign in</strong>.
        </p>

        <SignInWatcher callbackUrl={callbackUrl} />

        <ResendTimer callbackUrl={callbackUrl} sentAt={attempt.createdAt.getTime()} />

        <ul className="space-y-2 rounded-2xl border border-line bg-surface p-4 text-sm text-ink-muted">
          <li>• Can&apos;t see it? Check your spam or promotions folder.</li>
          <li>• The link works on any device, and only once. It expires in 15 minutes.</li>
        </ul>

        <p className="text-center text-sm">
          <Link href="/login" className="inline-flex min-h-11 items-center font-semibold text-accent underline-offset-4 hover:underline">
            Use a different email
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
