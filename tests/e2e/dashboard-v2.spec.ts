import { expect, test } from "@playwright/test";
import { api, signUpAndIn, skipOnboarding } from "./helpers";

test.describe.configure({ timeout: 150_000 });

test("onboarding asks how you read, and the dashboard follows it", async ({ page }) => {
  await signUpAndIn(page, "Kavya");
  await expect(page).toHaveURL(/\/dashboard\/welcome/);
  await page.getByText("Recite and chant").click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByText("ಕನ್ನಡ · Kannada").first().click();
  await page.getByLabel("Meaning in").selectOption("kn");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("switch").check({ force: true });
  await page.getByLabel("At").selectOption("6");
  await page.getByRole("button", { name: "Go to my dashboard" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  const prefs = (await api<{ prefs: Record<string, unknown> }>(page, "/api/me/prefs")).body.prefs;
  expect(prefs).toMatchObject({ goal: "recite", script: "kannada", meaningLang: "kn", dailyEmail: true, reminderHour: 6 });
  // Today's sloka is shown in Kannada script, with the recite prompt.
  const today = page.locator("section[aria-labelledby=today-title]");
  await expect(today.locator("[lang=sa-Knda]")).toHaveText(/[ಀ-೿]/);
  await expect(today.getByRole("link", { name: /Recite today's verse/ })).toBeVisible();
});

test("collections and a private note on a sloka page survive a reload", async ({ page }) => {
  await signUpAndIn(page, "Ravi");
  await skipOnboarding(page);
  await page.goto("/sloka/gayatri-mantra");
  await page.getByRole("button", { name: /Save .* to a collection/ }).click();
  await page.getByLabel("New collection name").fill("Morning chants");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByText('Saved to "Morning chants".')).toBeVisible();

  const note = page.getByLabel("My note");
  await note.fill("Chant three times at sunrise.");
  await expect(page.getByText("Saved", { exact: true })).toBeVisible({ timeout: 10_000 });

  await page.reload();
  await expect(page.getByRole("button", { name: /In 1 of your collections/ })).toBeVisible();
  await expect(page.getByLabel("My note")).toHaveValue("Chant three times at sunrise.");

  // The collection is on Favourites, with the note mark.
  await page.goto("/dashboard/favourites");
  await page.getByRole("button", { name: /Morning chants/ }).click();
  await expect(page.getByRole("heading", { name: /Gāyatrī Mantra/ })).toBeVisible();
  await expect(page.getByText("✎ Your note")).toBeVisible();
  // Nobody else can name another student's collection: extra fields are refused.
  expect((await api(page, "/api/me/notes", { method: "PUT", body: { slug: "gayatri-mantra", body: "x", userId: "someone" } })).status).toBe(400);
});

test("Ctrl+K finds a sloka by any spelling and opens it", async ({ page }) => {
  await page.goto("/library");
  await page.keyboard.press("Control+k");
  const box = page.getByRole("combobox", { name: "Search slokas and pages" });
  await expect(box).toBeFocused();
  await box.fill("krsna");
  await expect(page.getByRole("option", { name: /Bhagavad Gītā 2\.47/ }).first()).toBeVisible();
  await box.fill("karmany");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/sloka\/bhagavad-gita-2-47$/);
  // Escape closes it and gives focus back.
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog", { name: "Search and go" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Search and go" })).toBeHidden();
});

test("installable, and favourite slokas open with no connection", async ({ page, context }) => {
  const manifest = await page.request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBe(true);
  expect((await manifest.json()).start_url).toBe("/dashboard");
  const sw = await page.request.get("/sw.js");
  expect(sw.ok()).toBe(true);
  expect(sw.headers()["service-worker-allowed"]).toBe("/");

  // A guest favourites a sloka; the service worker saves it for offline reading.
  await page.goto("/sloka/gayatri-mantra");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.getByRole("button", { name: /^Save .* to favorites$/ }).first().click();
  await expect
    .poll(async () => page.evaluate(async () => Boolean(await (await caches.open("vs-saved-v1")).match("/sloka/gayatri-mantra"))), { timeout: 20_000 })
    .toBe(true);

  await context.setOffline(true);
  await page.goto("/sloka/gayatri-mantra");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Gāyatrī");
  // Pages that need the network show the offline page, listing what is saved.
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "You're offline" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Gāyatrī/ })).toBeVisible();
  await context.setOffline(false);
});
