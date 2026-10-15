import { test, expect } from "@playwright/test";
import { freshProgress } from "../src/lib/progress.ts";
import { generatedProject } from "../src/lib/daily-projects.mjs";
test.use({ timezoneId: "Africa/Johannesburg" });
async function fresh(page, plain = false) {
  const p = freshProgress();
  p.settings.editorMode = plain ? "plain" : "rich";
  await page.addInitScript((p) => {
    if (!localStorage.getItem("cq-progress-v1"))
      localStorage.setItem("cq-progress-v1", JSON.stringify(p));
  }, p);
}
test("student selects a declared string name, Console member and object member from editor suggestions", async ({
  page,
}) => {
  await fresh(page);
  await page.goto("/#playground");
  const code = page.getByRole("textbox", {
    name: "C# code editor",
    exact: true,
  });
  await code.fill('using System;\nstring name = "Ayo";\nConsole.WriteLine(');
  await code.press("Control+End");
  await code.pressSequentially("na");
  await expect(
    page.getByRole("option", { name: "namestring", exact: true }),
  ).toBeVisible();
  await code.press("Tab");
  await code.pressSequentially(");");
  await expect(code).toContainText("Console.WriteLine(name);");
  await page.getByRole("button", { name: "Run C#", exact: true }).click();
  await expect(page.locator(".run-feedback")).toContainText("Ayo", {
    timeout: 90000,
  });
  await code.fill("using System;\nConsole.");
  await code.press("Control+End");
  await page
    .getByRole("button", { name: "Suggest (Ctrl+Space)", exact: true })
    .click();
  await page.getByRole("option").filter({ hasText: "WriteLine" }).click();
  await expect(code).toContainText("Console.WriteLine");
  await code.fill('string name = "Ayo";\nname.');
  await code.press("Control+End");
  await code.press("Control+Space");
  await expect(
    page.getByRole("option").filter({ hasText: "Trim" }),
  ).toBeVisible();
  await code.press("Escape");
  await code.fill('string name = "Ayo";\nna');
  await code.press("Control+End");
  await code.press("Control+Space");
  await expect(
    page.getByRole("option", { name: "namestring", exact: true }),
  ).toBeVisible();
  await code.press("Enter");
  await expect(code).toHaveText(/name$/);
  await code.fill(
    "class Booking { public string Status {get;set;} public void CompleteBooking() {} }\nvar booking = new Booking();\nbooking.",
  );
  await code.press("Control+End");
  await code.press("Control+Space");
  await page.getByRole("option").filter({ hasText: "CompleteBooking" }).click();
  await expect(code).toContainText("booking.CompleteBooking");
  await page.setViewportSize({ width: 360, height: 800 });
  await code.fill('string name="Ayo";\nname.');
  await code.press("Control+End");
  await code.press("Control+Space");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 2,
    ),
  ).toBe(true);
});
test("daily projects change at local midnight, preserve active work and restore previous drafts", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-15T12:00:00Z") });
  await fresh(page, true);
  await page.goto("/#challenges");
  await page
    .getByRole("link", { name: "Daily repair project", exact: false })
    .click();
  const lab = page.locator(".repair-lab");
  await lab
    .getByRole("button", { name: "Open today’s repair", exact: true })
    .click();
  await expect(
    lab.getByRole("heading", {
      name: "Campus recovery · 2026-10-15 · project 1",
      exact: true,
    }),
  ).toBeVisible();
  const editor = lab.getByLabel("Repair C# program");
  await editor.fill("// my unfinished work");
  await lab
    .getByRole("button", { name: "Another repair project", exact: true })
    .click();
  await expect(editor).not.toHaveValue("// my unfinished work");
  await lab
    .getByRole("button", { name: "Open today’s repair", exact: true })
    .click();
  await expect(editor).toHaveValue("// my unfinished work");
  await lab
    .getByRole("button", { name: "Another repair project", exact: true })
    .click();
  await lab
    .getByRole("button", { name: "Restore previous project", exact: true })
    .click();
  await expect(editor).toHaveValue("// my unfinished work");
  await page.clock.setSystemTime(new Date("2026-10-15T22:01:00Z"));
  await page.clock.fastForward(61000);
  await expect(
    lab.getByRole("heading", {
      name: "Today’s project · 2026-10-16",
      exact: true,
    }),
  ).toBeVisible();
  await expect(editor).toHaveValue("// my unfinished work");
  await lab
    .getByRole("button", { name: "Open today’s repair", exact: true })
    .click();
  await expect(
    lab.getByRole("heading", {
      name: "Campus recovery · 2026-10-16 · project 1",
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    lab.getByRole("heading", {
      name: "Campus recovery · 2026-10-16 · project 1",
      exact: true,
    }),
  ).toBeVisible();
  await page.setViewportSize({ width: 360, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 2,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/daily-project-phone.png",
    fullPage: true,
  });
});
test("renewable project starters fail and solutions pass against all varying rule cases", async ({
  page,
}) => {
  test.setTimeout(180000);
  await fresh(page, true);
  await page.goto("/#challenges");
  await page.locator(".repair-lab > summary").click();
  const lab = page.locator(".repair-lab");
  await lab
    .getByRole("button", { name: "Open today’s repair", exact: true })
    .click();
  for (let round = 0; round < 3; round++) {
    if (round)
      await lab
        .getByRole("button", { name: "Another repair project", exact: true })
        .click();
    await page.waitForFunction(
      (r) =>
        JSON.parse(
          JSON.parse(localStorage.getItem("cq-progress-v1")).drafts[
            "repair-generated-spec"
          ],
        ).round === r,
      round,
    );
    const spec = await page.evaluate(() =>
      JSON.parse(
        JSON.parse(localStorage.getItem("cq-progress-v1")).drafts[
          "repair-generated-spec"
        ],
      ),
    );
    const project = generatedProject(spec.day, spec.round);
    await lab
      .getByRole("button", { name: "Check repairs", exact: true })
      .click();
    await expect(lab.locator(".repair-status")).toContainText(
      "checks passed.",
      { timeout: 90000 },
    );
    await expect(lab.locator(".repair-status")).not.toContainText(
      "All repair checks passed",
    );
    await lab.getByLabel("Repair C# program").fill(project.solution);
    await lab
      .getByRole("button", { name: "Check repairs", exact: true })
      .click();
    await expect(lab.locator(".repair-status")).toContainText(
      "All repair checks passed",
      { timeout: 90000 },
    );
  }
});
