import Link from "next/link";
import { env, isGoogleEnabled } from "@/lib/env";
import { EmailForm } from "./EmailForm";
import { Divider, FormMessage } from "./FormMessage";
import { GoogleButton } from "./GoogleButton";

type Props = {
  mode: "login" | "signup";
  callbackUrl: string;
  notice?: string | null;
  error?: string | null;
};

/** Shared body of the log in / sign up cards: Google, "or", email form, and the switch link. */
export function AuthPageBody({ mode, callbackUrl, notice, error }: Props) {
  const turnstileSiteKey = env().TURNSTILE_ENABLED ? env().NEXT_PUBLIC_TURNSTILE_SITE_KEY : undefined;
  const switchHref = `${mode === "login" ? "/signup" : "/login"}${callbackUrl === "/dashboard" ? "" : `?callbackUrl=${encodeURIComponent(callbackUrl)}`}`;

  return (
    <div className="space-y-5">
      {notice && <FormMessage tone="success">{notice}</FormMessage>}
      {error && <FormMessage tone="error">{error}</FormMessage>}

      <div>
        <GoogleButton enabled={isGoogleEnabled()} callbackUrl={callbackUrl} mode={mode} />
        <p className="mt-3 text-center text-xs leading-relaxed text-ink-muted">
          By continuing with Google, you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2 hover:text-accent">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-accent">
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      <Divider />

      <EmailForm mode={mode} callbackUrl={callbackUrl} turnstileSiteKey={turnstileSiteKey} />

      <p className="pt-2 text-center text-sm text-ink-muted">
        {mode === "login" ? "New to VedicSlokas? " : "Already have an account? "}
        <Link href={switchHref} className="inline-flex min-h-11 items-center font-semibold text-accent underline-offset-4 hover:underline">
          {mode === "login" ? "Create an account" : "Log in"}
        </Link>
      </p>
    </div>
  );
}

/** Kind, non-revealing copy for errors that come back from Google via ?error=. */
export function googleErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  if (code === "account_not_linked") {
    return "That Google account couldn't be connected to an existing account with the same email. Please sign in with an email link instead.";
  }
  return "Google sign-in didn't finish. Please try again, or use your email instead.";
}
