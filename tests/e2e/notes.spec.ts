import { expect, test } from "@playwright/test";
import { signUpAndIn, skipOnboarding } from "./helpers";

test.describe.configure({ timeout: 120_000 });

test("notes: every student gets the chapter PDFs, in the language they pick", async ({ page }) => {
  await signUpAndIn(page, "Nila");
  await skipOnboarding(page);
  await page.goto("/dashboard/notes");
  await expect(page.getByRole("heading", { name: "Arjuna Vishada Yoga" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Download English PDF" })).toHaveAttribute("href", /chapter-1-slokas-1-12-en\.pdf$/);

  await page.getByLabel("Choose your own language").selectOption("kn");
  const download = page.getByRole("link", { name: "Download Kannada PDF" });
  await expect(download).toHaveAttribute("href", /chapter-1-slokas-1-12-kn\.pdf$/);
  await expect(page.locator("iframe[title*='Kannada']")).toHaveAttribute("src", /-kn\.pdf#view=FitH$/);

  // Every language's PDF is served, and may be framed only by our own pages.
  for (const lang of ["sa", "en", "kn", "te", "ta"]) {
    const res = await page.request.get(`/notes/bhagavad-gita/chapter-1-slokas-1-12-${lang}.pdf`);
    expect(res.ok()).toBe(true);
    expect(res.headers()["content-type"]).toContain("application/pdf");
    expect(res.headers()["x-frame-options"]).toBe("SAMEORIGIN");
    expect(res.headers()["content-security-policy"]).toContain("frame-ancestors 'self'");
  }
  // Pages themselves still refuse to be framed anywhere.
  const pageRes = await page.request.get("/about");
  expect(pageRes.headers()["x-frame-options"]).toBe("DENY");
  expect(pageRes.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");

  await page.goto("/dashboard");
  await expect(page.locator("#home-soon").getByRole("link", { name: "Notes" })).toHaveCount(0);
});
