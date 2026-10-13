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

export const nameField = z
  .string({ error: "Please tell us your name." })
  .trim()
  .min(1, "Please tell us your name.")
  .max(80, "Please keep your name under 80 characters.");

export const loginSchema = z.object({ email: emailField });

export const signupSchema = z.object({
  name: nameField,
  email: emailField,
  consent: z.literal("on", { error: "Please agree to the Terms and Privacy Policy to continue." }),
});

export type FieldErrors = Partial<Record<"name" | "email" | "consent", string>>;

export function fieldErrorsOf(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if ((key === "name" || key === "email" || key === "consent") && !out[key]) out[key] = issue.message;
  }
  return out;
}
