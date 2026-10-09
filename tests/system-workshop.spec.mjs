import { test, expect } from "@playwright/test";
import { systemProjects } from "../src/lib/system-projects.mjs";
for (const project of systemProjects) {
  test(`${project.title}: real C# earns full marks and preserves student work`, async ({
    page,
  }) => {
    await page.goto("/#designer");
    await page
      .getByText("System workshop · ATM, loans and banking", { exact: true })
      .click();
    const workshop = page.getByRole("region", {
      name: "Build a complete system",
    });
    await workshop.getByLabel("System project").selectOption(project.id);
    await workshop
      .getByRole("button", { name: "Load worked example", exact: true })
      .click();
    const draft = await page.evaluate(() => [
      localStorage.getItem("cq-form"),
      localStorage.getItem("cq-practical-code"),
    ]);
    await workshop
      .getByRole("button", { name: "Grade my system", exact: true })
      .click();
    await expect(workshop.locator(".system-report h3")).toBeVisible({
      timeout: 90000,
    });
    await expect(
      workshop.getByRole("heading", {
        name: "100/100 · practice grade",
        exact: true,
      }),
    ).toBeVisible({ timeout: 15000 });
    expect(
      await page.evaluate(() => [
        localStorage.getItem("cq-form"),
        localStorage.getItem("cq-practical-code"),
      ]),
    ).toEqual(draft);
    await page.keyboard.press("F5");
    const app = page.getByRole("dialog", { name: "Running Form1 application" });
    await expect(app).toBeVisible();
    if (project.id === "atm-system") {
      await app
        .getByRole("textbox", { name: "txtAmount", exact: true })
        .fill("250");
      await app.getByRole("button", { name: "Deposit", exact: true }).click();
      await expect(app).toContainText("Balance: R1250.00", { timeout: 90000 });
      await app
        .getByRole("textbox", { name: "txtAmount", exact: true })
        .fill("100");
      await app.getByRole("button", { name: "Withdraw", exact: true }).click();
      await expect(app).toContainText("Balance: R1150.00", { timeout: 90000 });
      await expect(app.locator(".data-grid tbody tr")).toHaveCount(2);
    }
    if (project.id === "bank-manager") {
      await app
        .getByRole("textbox", { name: "txtCustomer", exact: true })
        .fill("Harvey");
      await app
        .getByRole("textbox", { name: "txtOpening", exact: true })
        .fill("500");
      await app
        .getByRole("button", { name: "Add account", exact: true })
        .click();
      await expect(app.locator(".data-grid tbody tr")).toHaveCount(1, {
        timeout: 90000,
      });
      await app
        .locator(".data-grid tbody tr")
        .getByRole("button")
        .first()
        .click();
      await app
        .getByRole("button", { name: "Remove selected", exact: true })
        .click();
      await expect(app.locator(".data-grid tbody tr")).toHaveCount(0, {
        timeout: 90000,
      });
    }
  });
}
test("half-written ATM receives partial credit and grade becomes stale after an edit", async ({
  page,
}) => {
  await page.goto("/#designer");
  await page
    .getByText("System workshop · ATM, loans and banking", { exact: true })
    .click();
  const workshop = page.getByRole("region", {
    name: "Build a complete system",
  });
  await workshop
    .getByRole("button", { name: "Load starter form", exact: true })
    .click();
  await workshop
    .getByRole("button", { name: "Grade my system", exact: true })
    .click();
  await page.keyboard.press("F5");
  await expect(
    page.getByRole("dialog", { name: "Running Form1 application" }),
  ).toHaveCount(0);
  await expect(
    workshop.getByRole("heading", {
      name: "30/100 · practice grade",
      exact: true,
    }),
  ).toBeVisible({ timeout: 15000 });
  await expect(workshop).toContainText("Tested behaviour: 0/50");
  await page
    .getByLabel("Practical C# code", { exact: true })
    .fill("// Still learning");
  await expect(
    workshop.getByRole("heading", {
      name: "30/100 · practice grade",
      exact: true,
    }),
  ).toHaveCount(0);
});
