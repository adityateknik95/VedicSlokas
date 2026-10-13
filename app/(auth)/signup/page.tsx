import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthPageBody, googleErrorMessage } from "@/components/auth/AuthPageBody";
import { AuthShell } from "@/components/auth/AuthShell";
import { safeCallbackUrl } from "@/lib/redirects";
import { param } from "@/lib/search-params";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const sp = await searchParams;
  const callbackUrl = safeCallbackUrl(param(sp.callbackUrl));
  if (await getSession()) redirect(callbackUrl);

  return (
    <AuthShell eyebrow="Create your account" title="Begin your journey">
      <AuthPageBody mode="signup" callbackUrl={callbackUrl} error={googleErrorMessage(param(sp.error))} />
    </AuthShell>
  );
}
