import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ConfirmForm, LinkProblem } from "@/components/auth/ConfirmForm";
import { FormMessage } from "@/components/auth/FormMessage";
import { StripToken } from "@/components/auth/StripToken";
import { getDb } from "@/db";
import { emailForToken, inspectToken } from "@/lib/magic-token";
import { safeCallbackUrl } from "@/lib/redirects";
import { param } from "@/lib/search-params";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Confirm sign in" };

/**
 * Opened from the emailed link. Viewing this page (a GET, which is all a mail scanner does)
 * only reads the token's status; the "Confirm sign in" POST is what uses it.
 */
export default async function ConfirmPage({ searchParams }: PageProps<"/auth/confirm">) {
  const sp = await searchParams;
  const token = param(sp.token) ?? "";
  const next = safeCallbackUrl(param(sp.next));

  const db = await getDb();
  const state = token ? await inspectToken(db, token) : "missing";
  const email = state === "valid" ? await emailForToken(db, token) : null;

  if (state !== "valid" || !email) {
    return (
      <AuthShell eyebrow="Sign in" title={state === "expired" ? "This link has expired" : "This link can't be used"}>
        <StripToken />
        <LinkProblem kind={state === "expired" ? "expired" : "invalid"} />
      </AuthShell>
    );
  }

  const session = await getSession();
  const switching = session && session.user.email.toLowerCase() !== email.toLowerCase();

  return (
    <AuthShell eyebrow="One last step" title="Confirm sign in">
      <div className="space-y-5">
        {/* The token now lives only in the form; take it out of the address bar and history. */}
        <StripToken />
        {session && !switching && <FormMessage tone="info">You&apos;re already signed in as this account. Confirming keeps you signed in.</FormMessage>}
        {switching && (
          <FormMessage tone="info">
            You&apos;re currently signed in as <strong className="break-all">{session.user.email}</strong>. Confirming will switch to the account below.
          </FormMessage>
        )}
        <ConfirmForm token={token} next={next} email={email} />
      </div>
    </AuthShell>
  );
}
