import { readFile } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const OUTBOX = path.resolve(".dev-outbox");
const unique = (name: string) => `${name}.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;

async function emailTo(address: string): Promise<{ subject: string; text: string }> {
  const file = path.join(OUTBOX, `${encodeURIComponent(address)}.json`);
  for (let i = 0; i < 40; i++) {
    try {
      return JSON.parse(await readFile(file, "utf8"));
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  throw new Error(`No email for ${address}`);
}
const linkIn = (text: string) => {
  const m = text.match(/https?:\/\/\S+\/auth\/confirm\?\S+/);
  if (!m) throw new Error("no confirm link in email");
  return m[0];
};

async function signUp(page: Page, name: string, email: string) {
  await page.goto("/signup");
  await page.getByLabel("Your name").fill(name);
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("checkbox", { name: /I agree/ }).check();
  await page.getByRole("button", { name: "Email me a sign in link" }).click();
  await expect(page).toHaveURL(/\/check-email/);
}

test("sign up form validates inline and focuses the first problem", async ({ page }) => {
  await page.goto("/signup");
  await page.getByRole("button", { name: "Email me a sign in link" }).click();
  await expect(page.locator("#name-error")).toHaveText("Please tell us your name.");
  await expect(page.locator("#email-error")).toHaveText("Please enter your email address.");
  await expect(page.locator("#consent-error")).toHaveText("Please agree to the Terms and Privacy Policy to continue.");
  // Screen readers get one summary via the live region.
  await expect(page.locator('form [aria-live="assertive"]')).toContainText("3 things to fix");
  await expect(page.getByLabel("Your name")).toBeFocused();
  await expect(page.getByLabel("Your name")).toHaveAttribute("aria-invalid", "true");

  await page.getByLabel("Email address").fill("asha@gmial.com");
  await expect(page.getByText("Did you mean")).toBeVisible();
  await page.getByRole("button", { name: "asha@gmail.com" }).click();
  await expect(page.getByLabel("Email address")).toHaveValue("asha@gmail.com");

  await page.getByLabel("Email address").fill("not-an-email");
  await page.getByLabel("Your name").fill("Asha");
  await page.getByRole("button", { name: "Email me a sign in link" }).click();
  await expect(page.locator("#email-error")).toContainText("doesn't look like a complete email address");
  await expect(page.getByLabel("Email address")).toBeFocused();
  await expect(page).toHaveURL(/\/signup/);
});

test("log in shows the same 'Check your inbox' screen for known and unknown emails", async ({ page, browser }) => {
  test.setTimeout(150_000);
  const known = unique("known");
  await signUp(page, "Known Student", known);
  // Signing up just sent this address a link; wait out the 60s resend cooldown (applies to every address alike).
  await page.waitForTimeout(61_000);

  const screens: string[] = [];
  for (const address of [known, unique("stranger")]) {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto("/login");
    await p.getByLabel("Email address").fill(address);
    await p.getByRole("button", { name: "Email me a sign in link" }).click();
    await expect(p).toHaveURL(/\/check-email$/);
    await expect(p.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
    const card = (await p.locator("section[aria-labelledby=auth-title]").innerText()).replace(address, "<email>");
    screens.push(card.replace(/Resend link in \d+ seconds?/, "Resend link in N seconds"));
    await ctx.close();
  }
  expect(screens[0]).toBe(screens[1]);
});

test("confirm page: viewing the link doesn't use it; the button does, once", async ({ page }) => {
  const email = unique("confirm");
  await signUp(page, "Confirm Student", email);
  const link = linkIn((await emailTo(email)).text);

  // A mail scanner (or the user) opening the link repeatedly must not consume it.
  await page.request.get(link);
  await page.request.get(link);
  const res = await page.goto(link);
  expect(res?.headers()["referrer-policy"]).toBe("no-referrer");
  expect(res?.headers()["x-frame-options"]).toBe("DENY");
  await expect(page.getByText(`Sign in as ${email}`)).toBeVisible();
  await expect(page).not.toHaveURL(/token=/); // stripped from the address bar

  await page.getByRole("button", { name: "Confirm sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: /Namaste, Confirm/ })).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
  await expect(page.getByText("No active plan yet")).toBeVisible();

  // Second use: friendly page with a way forward.
  await page.goto(link);
  await expect(page.getByRole("heading", { name: "This link can't be used" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Send me a new link" })).toBeVisible();

  // Signing out revokes the session.
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login\?signedOut=1/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fdashboard/);
});

test("protected routes redirect to log in with a safe callback", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fdashboard$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();

  await page.goto("/login?callbackUrl=https%3A%2F%2Fevil.example");
  await expect(page.locator('input[name="callbackUrl"]')).toHaveValue("/dashboard");
});

test("public pages stay static and the header offers Log in", async ({ page }) => {
  const res = await page.goto("/library");
  expect(res?.headers()["x-nextjs-cache"] ?? res?.headers()["x-nextjs-prerender"]).toBeTruthy();
  await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
});
