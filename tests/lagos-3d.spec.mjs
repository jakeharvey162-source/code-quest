import { test, expect } from "@playwright/test";

test("Lagos keeps its 2D coding world and offers a reversible 3D preview", async ({ page }) => {
  await page.goto("/#adventure/streetlights");
  await expect(page.getByRole("img", { name: /Rookie Street:/ })).toBeVisible();
  await page.getByRole("button", { name: "Explore in 3D (beta)" }).click();
  const game = page.getByRole("region", { name: "Playable Lagos coding district" });
  const fallback = page.getByRole("button", { name: "Explore in 3D (beta)" });
  await expect.poll(async () => await game.isVisible() || await fallback.isVisible(), {
    timeout: 30000,
  }).toBe(true);
  if (await game.isVisible()) {
    await expect(game.locator("canvas")).toBeVisible();
    await page.getByRole("button", { name: "View accessible 2D map" }).click();
  } else {
    await expect(page.getByRole("img", { name: /Rookie Street:/ })).toBeVisible();
    await expect(page.locator(".adventure-feedback")).toContainText("3D rendering is unavailable");
  }
  await expect(page.getByRole("img", { name: /Rookie Street:/ })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Mission C# solution" })).toBeVisible();
});

test("WebGL Lagos lets the learner walk to a real C# coding station", async ({ page }, testInfo) => {
  test.skip(!process.env.CODEQUEST_WEBGL_TEST, "Requires opted-in software WebGL");
  await page.goto("/#adventure/streetlights");
  await page.getByRole("button", { name: "Explore in 3D (beta)" }).click();
  const game = page.getByRole("region", { name: "Playable Lagos coding district" });
  await expect(game.locator("canvas")).toBeVisible({ timeout: 30000 });
  await expect(game).toContainText("3D PREVIEW", { timeout: 30000 });
  await game.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("actual-lagos-3d-desktop.png"), fullPage: true });
  await game.focus();
  await page.keyboard.down("w");
  await page.waitForTimeout(1500);
  await page.keyboard.up("w");
  await expect(game).toHaveAttribute("data-near-station", "true", { timeout: 15000 });
  await game.getByRole("button", { name: "Interact with coding station" }).click();
  await expect(page.getByRole("textbox", { name: "Mission C# solution" })).toBeFocused();
  await page.getByRole("button", { name: "View accessible 2D map" }).click();
  await expect(page.getByRole("img", { name: /Rookie Street:/ })).toBeVisible();
});
