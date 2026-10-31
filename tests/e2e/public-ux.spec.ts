import { expect, test } from "@playwright/test";
import { api, emailTo, uniqueEmail } from "./helpers";

test.describe.configure({ timeout: 120_000 });

test("the home page offers a verse first, not a sign-up", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator("section[aria-labelledby=hero-title]");
  await expect(hero.getByText("Today's sloka", { exact: true })).toBeVisible();
  await expect(hero.locator('a[href="/signup"]')).toHaveCount(0);
  await hero.getByRole("link", { name: "Read today's sloka" }).click();
  await expect(page).toHaveURL(/\/sloka\//);
});

test("first-run card: language and theme are remembered, and it can be dismissed", async ({ page }) => {
  await page.goto("/");
  const card = page.locator("section[aria-labelledby=first-run-title]");
  await card.getByRole("button", { name: "Kannada" }).click();
  await card.getByRole("button", { name: "Peace" }).click();
  await expect(card.getByRole("link", { name: /More on peace/ })).toHaveAttribute("href", "/library?theme=peace");
  // The verse above already follows the language.
  await expect(page.locator("section[aria-labelledby=hero-title] [lang=sa-Knda]")).toHaveText(/[ಀ-೿]/);
  await page.reload();
  await expect(card.getByRole("link", { name: /More on peace/ })).toBeVisible();
  await card.getByRole("button", { name: "Dismiss" }).click();
  await expect(card).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "From the universe, to you." })).toBeVisible();
  await expect(card).toHaveCount(0);
});

test("the header reaches the product from any page", async ({ page }) => {
  await page.goto("/about");
  const nav = page.locator("header nav").first();
  await expect(nav.getByRole("link")).toHaveText(["Library", "Translate", "Favourites", "About"]);
  await nav.getByRole("link", { name: "Translate" }).click();
  await expect(page).toHaveURL(/\/translate/);
  await nav.getByRole("link", { name: "Favourites" }).click();
  await expect(page).toHaveURL(/\/library\?favorites=1/);
  await expect(nav.getByRole("link", { name: "Favourites" })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Library" })).not.toHaveAttribute("aria-current", "page");
  // The footer agrees: guests are not sent to a login wall.
  await expect(page.locator("footer").getByRole("link", { name: "Your favourites" })).toHaveAttribute("href", "/library?favorites=1");
});

test("previous and next stay inside one text, and hide when there is no neighbour", async ({ page }) => {
  await page.goto("/sloka/gayatri-mantra");
  const nav = page.getByRole("navigation", { name: "More from Ṛgveda" });
  await expect(nav).toContainText("Earlier in Ṛgveda");
  await expect(nav).toContainText("Later in Ṛgveda");
  await expect(nav).not.toContainText("Liṅgāṣṭakam");
  await page.goto("/sloka/lingashtakam-1");
  await expect(page.getByRole("navigation", { name: /More from/ })).toHaveCount(0);
});

test("the library opens on the grid with visible filters; the wheel comes after", async ({ page }) => {
  await page.goto("/library");
  await page.getByRole("button", { name: "Kṛṣṇa", exact: true }).click();
  await expect(page).toHaveURL(/deity=/);
  await expect(page.getByText(/Showing/)).toContainText("8");
  const [grid, wheel] = await Promise.all([page.getByRole("heading", { name: "Results" }).boundingBox(), page.getByRole("heading", { name: "Or turn the wheel" }).boundingBox()]);
  expect(grid!.y).toBeLessThan(wheel!.y);
  await expect(page.getByText(/most loved/i)).toHaveCount(0);
});

test("the language toggle changes the verse and meaning, everywhere, and is remembered", async ({ page }) => {
  await page.goto("/sloka/gayatri-mantra");
  await expect(page.getByRole("link", { name: /Read it in/ })).toHaveCount(0);
  await page.getByRole("group", { name: "Reading language" }).getByRole("button", { name: "Kannada" }).click();
  await expect(page.locator("header p[lang=sa-Knda], article p[lang=sa-Knda]").first()).toHaveText(/[ಀ-೿]/);
  await expect(page.locator("section[aria-labelledby=translation-title] p[lang=kn]").first()).toHaveText(/[ಀ-೿]/);
  await page.reload();
  await expect(page.getByRole("group", { name: "Reading language" }).getByRole("button", { name: "Kannada" })).toHaveAttribute("aria-pressed", "true");
  await page.goto("/library");
  await expect(page.locator("li p[lang=sa-Knda]").first()).toHaveText(/[ಀ-೿]/);
});

test("a guest saves, is offered an account, and the saved slokas come along", async ({ page }) => {
  await page.goto("/sloka/gayatri-mantra");
  await page.getByRole("button", { name: /^Save .* to favourites$/ }).first().click();
  await expect(page.getByText("Saved on this device.")).toBeVisible();
  await page.getByRole("button", { name: "Keep on every device" }).click();
  await expect(page).toHaveURL(/\/signup\?callbackUrl=/);
  await expect(page.getByText("Your saved sloka will be added to your account.")).toBeVisible();

  const email = uniqueEmail("guest");
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Email me a sign in link" }).click();
  await expect(page).toHaveURL(/\/check-email/);
  const link = (await emailTo(email)).text.match(/https?:\/\/\S+\/auth\/confirm\?\S+/)?.[0];
  await page.goto(link!);
  await page.getByRole("button", { name: /sign in|continue|confirm/i }).first().click();
  await expect(page).toHaveURL(/\/sloka\/gayatri-mantra/);
  await expect.poll(async () => (await api<{ favourites: { slug: string }[] }>(page, "/api/me/favourites")).body.favourites.map((f) => f.slug)).toEqual(["gayatri-mantra"]);
});

test("no Listen button without a recording; temples moved to their own page", async ({ page }) => {
  await page.goto("/sloka/gayatri-mantra");
  await expect(page.getByRole("button", { name: /Play recitation/ })).toHaveCount(0);
  await page.goto("/about");
  await expect(page.locator('a[href*="tirumala.org"]')).toHaveCount(0);
  await page.locator("footer").getByRole("link", { name: "Pilgrimage" }).click();
  await expect(page).toHaveURL(/\/pilgrimage/);
  await expect(page.getByRole("heading", { name: "Temples to visit" })).toBeVisible();
});

test("no stray route text shows in the header", async ({ page }) => {
  await page.goto("/about");
  await expect(page.locator("header").first()).not.toContainText("/login");
});
