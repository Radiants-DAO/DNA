import { expect, test } from "@playwright/test";

test("desktop loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/.+/);
});
