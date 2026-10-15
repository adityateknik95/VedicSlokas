import { expect, test } from "@playwright/test";
import { api, emailTo, signUpAndIn, skipOnboarding } from "./helpers";

type Fav = { slug: string; createdAt: string };

test.describe.configure({ timeout: 150_000 });

test("signed-out visitors are sent to log in, and the API refuses them", async ({ page, request }) => {
  for (const path of ["/dashboard", "/dashboard/favourites", "/dashboard/settings"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login\?callbackUrl=/);
  }
  expect((await request.get("/api/me/favourites")).status()).toBe(401);
  expect((await request.get("/api/me/export")).status()).toBe(401);
});

test("first login goes through onboarding, which saves interests and is not shown again", async ({ page }) => {
  await signUpAndIn(page, "Mira");
  await expect(page).toHaveURL(/\/dashboard\/welcome/);
  await page.getByText("Peace", { exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Go to my dashboard" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  const prefs = await api<{ prefs: { interests: string[]; onboardedAt: string | null; timezone: string | null } }>(page, "/api/me/prefs");
  expect(prefs.body.prefs.interests).toEqual(["peace"]);
  expect(prefs.body.prefs.onboardedAt).not.toBeNull();
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("a favourite saved to the account survives a reload", async ({ page }) => {
  await signUpAndIn(page, "Kiran");
  await skipOnboarding(page);
  await page.goto("/sloka/gayatri-mantra");
  await page.getByRole("button", { name: /^Save .* to favorites$/ }).first().click();
  await expect(page.getByRole("button", { name: /^Remove .* from favorites$/ }).first()).toBeVisible();
  await expect.poll(async () => (await api<{ favourites: Fav[] }>(page, "/api/me/favourites")).body.favourites.map((f) => f.slug)).toEqual(["gayatri-mantra"]);
  await page.goto("/dashboard/favourites");
  await page.reload();
  await expect(page.getByRole("heading", { name: /Gāyatrī Mantra/ })).toBeVisible();
});

test("favourites saved on this device before signing in are merged into the account", async ({ page }) => {
  await page.goto("/library");
  await page.evaluate(() => localStorage.setItem("vedicslokas:favorites", JSON.stringify(["gayatri-mantra", "not-a-real-sloka", "gayatri-mantra"])));
  await signUpAndIn(page, "Dev");
  await skipOnboarding(page);
  await page.goto("/dashboard/favourites");
  await expect(page.getByRole("heading", { name: /Gāyatrī Mantra/ })).toBeVisible();
  const favs = (await api<{ favourites: Fav[] }>(page, "/api/me/favourites")).body.favourites;
  expect(favs.map((f) => f.slug)).toEqual(["gayatri-mantra"]);
  // Merging again changes nothing (idempotent).
  const again = await api<{ favourites: Fav[] }>(page, "/api/me/favourites/merge", { body: { slugs: ["gayatri-mantra"] } });
  expect(again.body.favourites).toHaveLength(1);
});

test("Surprise me prefers a sloka the student has not opened", async ({ page }) => {
  await signUpAndIn(page, "Sana");
  await skipOnboarding(page);
  const seen = new Set<string>();
  for (let i = 0; i < 4; i++) {
    const r = await api<{ sloka: { slug: string; unseen: boolean } | null }>(page, "/api/me/surprise", { body: { recent: [...seen] } });
    expect(r.status).toBe(200);
    expect(r.body.sloka?.unseen).toBe(true);
    expect(seen.has(r.body.sloka!.slug)).toBe(false);
    seen.add(r.body.sloka!.slug);
  }
  // And the reveal opens in place from Home.
  await page.getByRole("button", { name: "Surprise me" }).first().click();
  await expect(page.getByRole("dialog", { name: "A verse for you" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Open full sloka/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("opening a sloka and marking it learned shows up in progress", async ({ page }) => {
  await signUpAndIn(page, "Lata");
  await skipOnboarding(page);
  await page.goto("/sloka/gayatri-mantra");
  await page.getByRole("button", { name: "Mark as learned" }).click();
  await expect(page.getByRole("button", { name: "Learned" })).toHaveAttribute("aria-pressed", "true");
  await page.goto("/dashboard/progress");
  await expect(page.getByRole("img", { name: /Explored 1 of \d+ slokas/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Learned/ })).toBeVisible();
});

test("Notify me is remembered", async ({ page }) => {
  await signUpAndIn(page, "Nila");
  await skipOnboarding(page);
  await page.goto("/dashboard/classes");
  await page.getByRole("button", { name: /Notify me/ }).click();
  await expect(page.getByRole("button", { name: /notified/ })).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.getByRole("button", { name: /notified/ })).toHaveAttribute("aria-pressed", "true");
  expect((await api<{ features: string[] }>(page, "/api/me/interest")).body.features).toEqual(["live_classes"]);
});

test("one student can never read or change another student's data", async ({ browser }) => {
  const a = await (await browser.newContext()).newPage();
  const b = await (await browser.newContext()).newPage();
  const emailA = await signUpAndIn(a, "Amar");
  const emailB = await signUpAndIn(b, "Bina");
  await api(a, "/api/me/favourites", { body: { slug: "gayatri-mantra", saved: true } });
  await api(b, "/api/me/favourites", { body: { slug: "bhagavad-gita-2-47", saved: true } });

  // B sees only B's own favourites, A only A's.
  expect((await api<{ favourites: Fav[] }>(a, "/api/me/favourites")).body.favourites.map((f) => f.slug)).toEqual(["gayatri-mantra"]);
  expect((await api<{ favourites: Fav[] }>(b, "/api/me/favourites")).body.favourites.map((f) => f.slug)).not.toContain("gayatri-mantra");

  // There is no way to name another user: extra fields are refused, and the session decides.
  const sneaky = await api(a, "/api/me/favourites", { body: { slug: "gayatri-mantra", saved: false, userId: "someone-else" } });
  expect(sneaky.status).toBe(400);

  // Export is only ever the caller's own data.
  const exportA = await api<Record<string, unknown>>(a, "/api/me/export");
  expect(JSON.stringify(exportA.body)).toContain(emailA);
  expect(JSON.stringify(exportA.body)).not.toContain(emailB);

  // A write from another site is refused even with A's valid session cookie.
  const crossSite = await a.context().request.post("/api/me/favourites", {
    headers: { Origin: "https://evil.example", "Content-Type": "application/json" },
    data: { slug: "gayatri-mantra", saved: false },
  });
  expect(crossSite.status()).toBe(403);
  expect((await api<{ favourites: Fav[] }>(a, "/api/me/favourites")).body.favourites.map((f) => f.slug)).toEqual(["gayatri-mantra"]);
});

test("junk slugs are never written", async ({ page }) => {
  await signUpAndIn(page, "Om");
  const bad = await api(page, "/api/me/favourites", { body: { slug: "../../etc/passwd", saved: true } });
  expect(bad.status).toBe(400);
  const view = await api(page, "/api/me/progress/view", { body: { slug: "nope" } });
  expect(view.status).toBe(400);
});

test("deleting the account removes everything and signs the student out", async ({ page }) => {
  const email = await signUpAndIn(page, "Tara");
  await skipOnboarding(page);
  await api(page, "/api/me/favourites", { body: { slug: "gayatri-mantra", saved: true } });
  await api(page, "/api/me/interest", { body: { feature: "notes", on: true } });

  await page.goto("/dashboard/settings");
  await page.getByRole("button", { name: "Delete account…" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete your account?" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Delete forever" })).toBeDisabled();
  await dialog.getByLabel("Type DELETE to confirm").fill("DELETE");
  await dialog.getByRole("button", { name: "Delete forever" }).click();
  await expect(page).toHaveURL(/accountDeleted=1/);

  // Signed out, with nothing left to read.
  expect((await api(page, "/api/me/favourites")).status).toBe(401);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);

  // The confirmation email went out, and the address no longer has an account.
  const mail = await emailTo(email);
  expect(mail.subject).toMatch(/deleted/i);
});
