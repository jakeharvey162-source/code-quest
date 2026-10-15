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
test("student and lecturer use the Tor desk, resume conversation, practise and follow official sources", async ({
  page,
}) => {
  await fresh(page);
  await page.goto("/#home");
  await page
    .getByRole("button", { name: "Open Tor tutor", exact: true })
    .click();
  await page.getByRole("link", { name: "Open Tor study desk" }).click();
  await expect(
    page.getByRole("heading", { name: "Tor’s study desk" }),
  ).toBeVisible();
  await expect(page.locator(".tor-coach")).toHaveCount(0);
  await page
    .getByRole("button", {
      name: "What if bookings.txt is missing?",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("region", { name: "Study conversation" }),
  ).toContainText("does not contain bookings.txt");
  await page.getByLabel("I’m here as").selectOption("lecturer");
  await page
    .getByRole("button", {
      name: "Create a repair assignment and suggested rubric",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("region", { name: "Study conversation" }),
  ).toContainText("not an official UJ rubric");
  await page.getByLabel("Study question").fill("Can you browse the web?");
  await page.getByRole("button", { name: "Send to Tor", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Study conversation" }),
  ).toContainText("does not contact a language model");
  await page
    .getByRole("button", { name: "New practice question", exact: true })
    .click();
  await expect(page.getByRole("radio").first()).toBeVisible();
  await page.getByRole("radio").first().check();
  await expect(page.getByRole("status").last()).not.toBeEmpty();
  await expect(
    page.getByRole("link", { name: "C# properties" }),
  ).toHaveAttribute("href", /learn.microsoft.com/);
  await page.reload();
  await expect(
    page.getByRole("region", { name: "Study conversation" }),
  ).toContainText("Can you browse the web?");
  await page.setViewportSize({ width: 360, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 2,
    ),
  ).toBe(true);
  const scan = await new AxeBuilder({ page })
    .include(".tor-study-page")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(scan.violations).toEqual([]);
  await page
    .getByRole("button", { name: "Clear conversation", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Study conversation" }),
  ).not.toContainText("Can you browse the web?");
});

test("Tor study desk and practice project remain available offline after caching", async ({
  page,
  context,
}) => {
  await fresh(page);
  await page.goto("/#tor");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await page
    .getByRole("button", {
      name: "Help me debug the equipment booking practice",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("region", { name: "Study conversation" }),
  ).toContainText("F10");
  await page
    .getByRole("button", { name: "New practice question", exact: true })
    .click();
  await expect(page.getByRole("radio").first()).toBeVisible();
  await page.screenshot({
    path: "test-results/tor-study-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.screenshot({
    path: "test-results/tor-study-phone.png",
    fullPage: true,
  });
  await page.goto("/#challenges/equipment-booking");
  await page
    .getByText("Your full practice task: project recovery and booking rules", {
      exact: true,
    })
    .click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", {
      name: "Download practice Windows project",
      exact: true,
    })
    .click();
  expect((await download).suggestedFilename()).toBe(
    "EquipmentBooking-Practice.zip",
  );
  await context.setOffline(false);
});
