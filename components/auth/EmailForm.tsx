"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { requestLoginLink, requestSignupLink } from "@/app/(auth)/actions";
import { fieldErrorsOf, loginSchema, signupSchema, type FieldErrors } from "@/lib/auth-schemas";
import { IDLE, type RequestLinkState } from "@/lib/auth-states";
import { suggestEmail } from "@/lib/email-typos";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";
import { Turnstile } from "./Turnstile";
import { formatWait, useCountdown } from "./useCountdown";

type Props = { mode: "login" | "signup"; callbackUrl: string; turnstileSiteKey?: string };
type Field = keyof FieldErrors;
const ORDER: Field[] = ["name", "email", "consent"];

export function EmailForm({ mode, callbackUrl, turnstileSiteKey }: Props) {
  const action = mode === "login" ? requestLoginLink : requestSignupLink;
  const [state, formAction] = useActionState<RequestLinkState, FormData>(action, IDLE);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [email, setEmail] = useState(state.status === "invalid" ? (state.values.email ?? "") : "");
  const [name, setName] = useState(state.status === "invalid" ? (state.values.name ?? "") : "");
  const [consent, setConsent] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const retryAt = state.status === "rate_limited" ? state.retryAt : null;
  const wait = useCountdown(retryAt);
  const suggestion = email.includes("@") ? suggestEmail(email.trim()) : null;

  const validate = (values: { name: string; email: string; consent: boolean }): FieldErrors => {
    const input = { name: values.name, email: values.email, consent: values.consent ? "on" : undefined };
    const result = mode === "login" ? loginSchema.safeParse(input) : signupSchema.safeParse(input);
    return result.success ? {} : fieldErrorsOf(result.error);
  };

  const focusFirstError = (errs: FieldErrors) => {
    const messages = ORDER.map((f) => errs[f]).filter(Boolean);
    // Screen readers hear a summary; focus lands on the first field to fix.
    setAnnouncement(messages.length ? `${messages.length === 1 ? "One thing" : `${messages.length} things`} to fix: ${messages.join(" ")}` : "");
    const first = ORDER.find((f) => errs[f]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  };

  // Server-side validation errors (e.g. JS-free submit, or a crafted request).
  useEffect(() => {
    if (state.status === "invalid") {
      setErrors(state.fieldErrors);
      focusFirstError(state.fieldErrors);
    }
  }, [state]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    const errs = validate({ name, email, consent });
    if (Object.keys(errs).length) {
      e.preventDefault();
      setErrors(errs);
      setTouched({ name: true, email: true, consent: true });
      focusFirstError(errs);
    }
  };

  const recheck = (field: Field, next: { name?: string; email?: string; consent?: boolean }) => {
    if (!touched[field] && !errors[field]) return;
    const errs = validate({ name, email, consent, ...next });
    setErrors((prev) => ({ ...prev, [field]: errs[field] }));
  };

  const fieldProps = (field: Field) => ({
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": [errors[field] ? `${field}-error` : null, field === "email" && suggestion ? "email-suggestion" : null].filter(Boolean).join(" ") || undefined,
  });

  return (
    <form ref={formRef} action={formAction} onSubmit={onSubmit} noValidate className="space-y-5">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <p className="sr-only" aria-live="assertive" aria-atomic="true">
        {announcement}
      </p>

      {mode === "signup" && (
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-semibold text-ink">
            Your name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            autoCapitalize="words"
            enterKeyHint="next"
            required
            maxLength={80}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              recheck("name", { name: e.target.value });
            }}
            onBlur={() => {
              setTouched((t) => ({ ...t, name: true }));
              setErrors((prev) => ({ ...prev, name: validate({ name, email, consent }).name }));
            }}
            className="field"
            {...fieldProps("name")}
          />
          {errors.name && (
            <p id="name-error" className="field-error mt-2 text-sm">
              {errors.name}
            </p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-semibold text-ink">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="send"
          required
          maxLength={254}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            recheck("email", { email: e.target.value });
          }}
          onBlur={() => {
            setTouched((t) => ({ ...t, email: true }));
            if (email) setErrors((prev) => ({ ...prev, email: validate({ name, email, consent }).email }));
          }}
          className="field"
          {...fieldProps("email")}
        />
        {errors.email && (
          <p id="email-error" className="field-error mt-2 text-sm">
            {errors.email}
          </p>
        )}
        {suggestion && !errors.email && (
          <p id="email-suggestion" className="mt-2 text-sm text-ink-muted" aria-live="polite">
            Did you mean{" "}
            <button
              type="button"
              onClick={() => {
                setEmail(suggestion);
                setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              className="min-h-11 rounded font-semibold text-accent underline underline-offset-4 hover:text-flame"
            >
              {suggestion}
            </button>
            ?
          </p>
        )}
      </div>

      {mode === "signup" && (
        <div>
          <div className="flex min-h-11 items-start gap-3 py-1">
            <input
              id="consent"
              name="consent"
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                setTouched((t) => ({ ...t, consent: true }));
                setErrors((prev) => ({ ...prev, consent: e.target.checked ? undefined : prev.consent }));
              }}
              className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer accent-[var(--saffron)]"
              {...fieldProps("consent")}
            />
            <label htmlFor="consent" className="text-sm leading-relaxed text-ink-muted">
              I agree to the{" "}
              <Link href="/terms" target="_blank" className="font-semibold text-accent underline underline-offset-4">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" target="_blank" className="font-semibold text-accent underline underline-offset-4">
                Privacy Policy
              </Link>
              .
            </label>
          </div>
          {errors.consent && (
            <p id="consent-error" className="field-error mt-2 text-sm">
              {errors.consent}
            </p>
          )}
        </div>
      )}

      <Turnstile siteKey={turnstileSiteKey} />

      {state.status === "error" && <FormMessage tone="error">{state.message}</FormMessage>}
      {state.status === "rate_limited" && (
        <FormMessage tone="info">
          {wait > 0 ? (
            <>
              That&apos;s a lot of sign-in emails in a short time. Please wait <strong>{formatWait(wait)}</strong> and try again.
            </>
          ) : (
            <>You can try again now.</>
          )}
        </FormMessage>
      )}

      <SubmitButton pendingLabel="Sending your link…" disabled={wait > 0}>
        Email me a sign in link
      </SubmitButton>
    </form>
  );
}
