import { z } from "zod";

// Never use eval-compiled validators: our Content-Security-Policy forbids eval, and
// without this Zod probes for it (logging a CSP violation) before falling back anyway.
z.config({ jitless: true });

/** Form validation shared by the browser (inline errors) and the server (source of truth). */

export const emailField = z
  .string({ error: "Please enter your email address." })
  .trim()
  .toLowerCase()
  .min(1, "Please enter your email address.")
  .max(254, "That email address is too long.")
  .pipe(z.email("That doesn't look like a complete email address. Please check it."));

export const loginSchema = z.object({ email: emailField });

/** Only the address: the name is optional and asked for later, and the terms line sits under the form. */
export const signupSchema = z.object({ email: emailField });

export type FieldErrors = Partial<Record<"email", string>>;

export function fieldErrorsOf(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (key === "email" && !out[key]) out[key] = issue.message;
  }
  return out;
}
