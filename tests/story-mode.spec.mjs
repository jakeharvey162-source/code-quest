import { test, expect } from "@playwright/test";
import { freshProgress } from "../src/lib/progress.ts";

test("optional Rookie Street story starts a genuine existing C# lesson", async ({ page }) => {
  await page.goto("/#home");
  const story = page.getByRole("region", { name: "Optional CodeQuest story mode" });
  await expect(story.getByRole("heading", { name: "Rookie Street needs a developer." })).toBeVisible();
  await expect(story.getByRole("heading", { name: "Your missions" })).toBeHidden();
  await story.getByRole("button", { name: "Enter story mode" }).click();
  await expect(story.getByRole("heading", { name: "Your missions" })).toBeVisible();
  await expect(story.locator(".rookie-mission")).toHaveCount(3);
  await expect(story.locator(".rookie-story-count")).toContainText("0/3");
  await story.getByRole("link", { name: "Play mission" }).first().click();
  await expect(page).toHaveURL(/#learn\/variables$/);
  await expect(page.getByText("The price of a plan").first()).toBeVisible();
});

test("Story Mode restores landmarks only for genuine saved completions", async ({ page }) => {
  const progress = freshProgress();
  progress.completed = ["variables"];
  progress.steps = { strings: ["see"] };
  await page.addInitScript((saved) => {
    localStorage.setItem("cq-progress-v1", JSON.stringify(saved));
  }, progress);
  await page.goto("/#home");
  const story = page.getByRole("region", { name: "Optional CodeQuest story mode" });
  await expect(story.locator(".rookie-story-count")).toContainText("1/3");
  await story.getByRole("button", { name: "Enter story mode" }).click();
  await expect(story.locator(".rookie-mission-complete")).toHaveCount(1);
  await expect(story.locator(".rookie-mission-in-progress")).toHaveCount(1);
  await expect(story.locator(".rookie-story-building.is-restored")).toHaveCount(1);
  await expect(story.getByRole("link", { name: "Continue: Open the name studio" })).toBeVisible();
  await expect(page.locator(".xp-pill")).toBeVisible();
});

test("story and language entry fit 360px without a new mandatory game mode", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/#home");
  const story = page.getByRole("region", { name: "Optional CodeQuest story mode" });
  await story.getByRole("button", { name: "Enter story mode" }).click();
  await expect(story.getByRole("link", { name: /Python\s+Runnable terminal/ })).toBeVisible();
  await expect(story.getByRole("link", { name: /JavaScript\s+Runnable terminal/ })).toBeVisible();
  await expect(story.locator(".rookie-mission")).toHaveCount(3);
  const noPageOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  expect(noPageOverflow).toBe(true);
  await story.getByRole("button", { name: "Close story map" }).click();
  await expect(story.getByRole("heading", { name: "Your missions" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Start your first quest" })).toBeVisible();
});


test("language launchpad opens the selected real runtime without claiming a new course", async ({ page }) => {
  await page.goto("/#home");
  const story = page.getByRole("region", { name: "Optional CodeQuest story mode" });
  await story.getByRole("button", { name: "Enter story mode" }).click();
  await story.getByRole("link", { name: /Python\s+Runnable terminal/ }).click();
  await expect(page).toHaveURL(/#terminal$/);
  expect(await page.evaluate(() => localStorage.getItem("cq-terminal-language"))).toBe("python");
});
