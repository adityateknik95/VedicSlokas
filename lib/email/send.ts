import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Resend } from "resend";
import { env } from "@/lib/env";
import type { EmailContent } from "./templates";

/** Where development emails are written when RESEND_API_KEY is not set. Read by the e2e tests. */
export const DEV_OUTBOX_DIR = path.resolve(/*turbopackIgnore: true*/ process.cwd(), ".dev-outbox");

let warned = false;

/** Sends an email. Throws on failure so callers can offer a retry. */
export async function sendEmail(to: string, content: EmailContent): Promise<void> {
  const { RESEND_API_KEY, EMAIL_FROM } = env();

  if (!RESEND_API_KEY) {
    if (!warned) {
      console.warn(`[email] RESEND_API_KEY is not set; writing emails to ${DEV_OUTBOX_DIR} instead (development only).`);
      warned = true;
    }
    await mkdir(DEV_OUTBOX_DIR, { recursive: true });
    const file = path.join(DEV_OUTBOX_DIR, `${encodeURIComponent(to.toLowerCase())}.json`);
    await writeFile(file, JSON.stringify({ to, sentAt: new Date().toISOString(), ...content }, null, 2), "utf8");
    return;
  }

  const resend = new Resend(RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: EMAIL_FROM ?? "VedicSlokas <onboarding@resend.dev>",
    to,
    subject: content.subject,
    html: content.html,
    text: content.text,
    headers: { "X-Entity-Ref-ID": crypto.randomUUID() }, // stops Gmail threading separate sign-in emails
  });
  if (error) throw new Error(`Resend: ${error.name}: ${error.message}`);
}
