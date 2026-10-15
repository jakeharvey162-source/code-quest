import { test, expect } from "@playwright/test";
import { consoleChallenges } from "../src/lib/console-challenges.mjs";
async function setCode(page, code) {
  const editor = page.getByRole("textbox", { name: "Beginner C# code" });
  await editor.fill(code);
}
test("beginner console prompts twice, accepts blank input, stops, reports errors and checks solutions", async ({
  page,
}) => {
  await page.goto("/#challenges/console");
  await expect(
    page.getByRole("heading", { name: "Start with the console" }),
  ).toBeVisible();
  await setCode(
    page,
    'using System;\nConsole.Write("Name: ");\nstring name=Console.ReadLine();\nConsole.Write("Age: ");\nstring age=Console.ReadLine();\nConsole.WriteLine(name+":"+age);',
  );
  await page.getByRole("button", { name: "Run console", exact: true }).click();
  const field = page.getByRole("textbox", {
    name: "Console input",
    exact: true,
  });
  await expect(field).toBeEnabled({ timeout: 90000 });
  await expect(page.getByLabel("Console output")).toContainText("Name:");
  await field.fill("Ayo");
  await field.press("Enter");
  await expect(field).toBeEnabled({ timeout: 30000 });
  await expect(page.getByLabel("Console output")).toContainText("Age:");
  await field.fill("19");
  await field.press("Enter");
  await expect(
    page.getByLabel("Interactive C# console").getByRole("status"),
  ).toHaveText("Program finished.", { timeout: 30000 });
  await expect(page.getByLabel("Console output")).toContainText("Ayo:19");
  await page.getByRole("button", { name: "Run console", exact: true }).click();
  await expect(field).toBeEnabled();
  await field.press("Enter");
  await expect(field).toBeEnabled();
  await page.getByRole("button", { name: "End input (EOF)" }).click();
  await expect(
    page.getByLabel("Interactive C# console").getByRole("status"),
  ).toHaveText("Program finished.");
  await page.getByRole("button", { name: "Run console", exact: true }).click();
  await expect(field).toBeEnabled();
  await page.getByRole("button", { name: "Stop console", exact: true }).click();
  await expect(field).toBeDisabled();
  await setCode(page, "using System; Console.WriteLine(missing);");
  await page.getByRole("button", { name: "Run console", exact: true }).click();
  await expect(
    page.getByLabel("Interactive C# console").getByRole("status"),
  ).toContainText("CS0103");
  for (const challenge of consoleChallenges) {
    await page
      .getByLabel("Console challenge", { exact: true })
      .selectOption(challenge.id);
    await setCode(page, challenge.solution);
    await page
      .getByRole("button", { name: "Check console solution", exact: true })
      .click();
    await expect(
      page
        .getByRole("status")
        .filter({
          hasText: "All " + challenge.cases.length + " tests passed!",
        }),
    ).toBeVisible({ timeout: 60000 });
  }
  await page.setViewportSize({ width: 360, height: 800 });
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await page.screenshot({
    path: "test-results/console-phone.png",
    fullPage: true,
  });
});
