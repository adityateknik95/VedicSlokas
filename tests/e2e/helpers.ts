import { readFile } from "node:fs/promises";
import path from "node:path";
import { expect, type Page } from "@playwright/test";

/**
 * Test sign-in that cannot exist in production: it reads magic-link emails from the local
 * .dev-outbox folder, which the app only writes to when no email provider is configured
 * (never on Vercel: production requires RESEND_API_KEY). Nothing here ships in the app bundle.
 */

const OUTBOX = path.resolve(".dev-outbox");

const rand = () => Math.floor(Math.random() * 250) + 1;

export const uniqueEmail = (name: string) => `${name}.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;

export async function emailTo(address: string): Promise<{ subject: string; text: string }> {
  const file = path.join(OUTBOX, `${encodeURIComponent(address.toLowerCase())}.json`);
  for (let i = 0; i < 80; i++) {
    try {
      return JSON.parse(await readFile(file, "utf8"));
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  throw new Error(`No email for ${address}`);
}

/** Creates an account through the real sign-up form and magic link, and lands signed in. */
export async function signUpAndIn(page: Page, name: string, email = uniqueEmail(name.toLowerCase())): Promise<string> {
  // Each test browser gets its own client address, as real students would, so the sign-in
  // rate limit (per IP) applies per test. Only the local test server reads this header;
  // on Vercel the platform sets it.
  await page.context().setExtraHTTPHeaders({ "x-forwarded-for": `10.${rand()}.${rand()}.${rand()}` });
  await page.goto("/signup");
  await page.getByLabel("Your name").fill(name);
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("checkbox", { name: /I agree/ }).check();
  await page.getByRole("button", { name: "Email me a sign in link" }).click();
  await expect(page).toHaveURL(/\/check-email/);
  const { text } = await emailTo(email);
  const link = text.match(/https?:\/\/\S+\/auth\/confirm\?\S+/)?.[0];
  if (!link) throw new Error("no confirm link in email");
  await page.goto(link);
  await page.getByRole("button", { name: /sign in|continue|confirm/i }).first().click();
  await expect(page).toHaveURL(/\/dashboard/);
  return email;
}

/** Finishes onboarding quickly so Home is reachable. */
export async function skipOnboarding(page: Page) {
  if (!/\/dashboard\/welcome/.test(page.url())) await page.goto("/dashboard/welcome");
  await page.getByRole("button", { name: "Skip for now" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

/** JSON request as the signed-in browser (same cookies, same origin). */
export async function api<T>(page: Page, path: string, init: { method?: string; body?: unknown } = {}): Promise<{ status: number; body: T }> {
  return page.evaluate(
    async ({ path, init }) => {
      const res = await fetch(path, {
        method: init.method ?? (init.body === undefined ? "GET" : "POST"),
        headers: init.body === undefined ? undefined : { "Content-Type": "application/json" },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
      });
      let body: unknown = null;
      try {
        body = await res.json();
      } catch {
        body = null;
      }
      return { status: res.status, body: body as T };
    },
    { path, init },
  );
}
