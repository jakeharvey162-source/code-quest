import { test, expect } from "@playwright/test";
import { freshProgress } from "../src/lib/progress.ts";
import AxeBuilder from "@axe-core/playwright";
async function fresh(page) {
  const p = freshProgress();
  p.settings.editorMode = "plain";
  await page.addInitScript((p) => {
    if (!localStorage.getItem("cq-progress-v1"))
      localStorage.setItem("cq-progress-v1", JSON.stringify(p));
  }, p);
}
test("student opens the supplied practice, reads recovery requirements and downloads the original broken project", async ({
  page,
}) => {
  await fresh(page);
  await page.goto("/#challenges/equipment-booking");
  const lab = page.locator(".repair-lab");
  await expect(
    lab.getByRole("heading", {
      name: "Practice Question 15 OCT: Equipment Booking",
      exact: true,
    }),
  ).toBeVisible();
  await lab
    .getByText("Your full practice task: project recovery and booking rules", {
      exact: true,
    })
    .click();
  await expect(lab.locator(".equipment-paper")).toContainText(
    "no bookings.txt",
  );
  const download = page.waitForEvent("download");
  await lab
    .getByRole("button", { name: "Download practice Windows project" })
    .click();
  expect((await download).suggestedFilename()).toBe(
    "EquipmentBooking-Practice.zip",
  );
  await page.goto("/#challenges/device-loans");
  await expect(
    lab.getByRole("heading", { name: "Similar project: campus device loans" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 360, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 2,
    ),
  ).toBe(true);
});
test("guest Tor Study Desk route explains account requirement without exposing chat history", async ({page}) => {
  await fresh(page);
  await page.goto("/#tor");
  await expect(page.getByRole("heading", {name:"Join CodeQuest to connect"})).toBeVisible();
  await expect(page.getByRole("region", {name:"Study conversation"})).toHaveCount(0);
  await page.getByRole("button", {name:"Create account or sign in"}).click();
  await expect(page).toHaveURL(/#account$/);
});
test("equipment project remains available offline while member-only Tor desk stays protected", async ({page,context}) => {
  await fresh(page);
  await page.goto("/#challenges/equipment-booking");
  await page.evaluate(async () => await navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", {name:"Practice Question 15 OCT: Equipment Booking",exact:true})).toBeVisible();
  await page.goto("/#tor");
  await expect(page.getByRole("heading", {name:"Join CodeQuest to connect"})).toBeVisible();
  await context.setOffline(false);
});
