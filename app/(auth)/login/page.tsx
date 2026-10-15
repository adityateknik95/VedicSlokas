import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthPageBody, googleErrorMessage } from "@/components/auth/AuthPageBody";
import { AuthShell } from "@/components/auth/AuthShell";
import { safeCallbackUrl } from "@/lib/redirects";
import { param } from "@/lib/search-params";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const callbackUrl = safeCallbackUrl(param(sp.callbackUrl));
  // Asked to confirm it's them before something permanent: show the form even when signed in.
  const reauth = Boolean(param(sp.reauth));
  // Already signed in (a valid session, not just a cookie): go straight on.
  if (!reauth && (await getSession())) redirect(callbackUrl);

  const notice = reauth
    ? "For your safety, please sign in again to continue. We'll take you straight back."
    : param(sp.signedOut)
    ? "You've signed out. See you soon."
    : param(sp.expired)
      ? "Your session has ended. Please sign in again and we'll take you back where you were."
      : null;

  return (
    <AuthShell eyebrow="Log in" title="Welcome back">
      <AuthPageBody mode="login" callbackUrl={callbackUrl} notice={notice} error={googleErrorMessage(param(sp.error))} />
    </AuthShell>
  );
}
