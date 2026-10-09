import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import { addControl } from "../src/designer-engine.mjs";
test("student creates an OOP class, runs both files, exports, earns XP once and keeps a dark theme", async ({
  page,
}) => {
  await page.goto("/#playground");
  await page.getByRole("button", { name: "Add class / C# item" }).click();
  await page.getByLabel("Class name", { exact: true }).fill("Account");
  await page
    .getByRole("button", { name: "Create C# file", exact: true })
    .click();
  const editor = page.getByRole("textbox", {
    name: "C# code editor",
    exact: true,
  });
  await editor.fill(
    "using System;\npublic class Account { public decimal Balance { get; set; } = 250m; }",
  );
  await page.getByLabel("Active C# file").selectOption("Program.cs");
  await editor.fill(
    "using System;\nvar account = new Account();\nConsole.WriteLine(account.Balance);",
  );
  await page.getByRole("button", { name: "Run C#", exact: true }).click();
  await expect(page.locator(".run-feedback")).toHaveText("250\n", {
    timeout: 90000,
  });
  await expect(page.locator(".xp-pill")).toContainText("120 XP");
  await page.getByRole("button", { name: "Run C#", exact: true }).click();
  await expect(page.locator(".run-feedback")).toHaveText("250\n", {
    timeout: 90000,
  });
  await expect(page.locator(".xp-pill")).toContainText("120 XP");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByLabel("Active C# file").selectOption("Account.cs");
  await expect(editor).toContainText("Balance");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export C# project ZIP" }).click();
  const archive = await download;
  expect(archive.suggestedFilename()).toBe("CodeQuestConsole.zip");
  await page.getByText("Open ZIP / project files", { exact: true }).click();
  await page.getByLabel("Choose project file").setInputFiles({
    name: archive.suggestedFilename(),
    mimeType: "application/zip",
    buffer: await readFile(await archive.path()),
  });
  await page
    .getByRole("button", { name: "Open all C# project files", exact: true })
    .click();
  await expect(page.getByLabel("Active C# file")).toHaveValue("Program.cs");
  await page.getByRole("button", { name: "Run C#", exact: true }).click();
  await expect(page.locator(".run-feedback")).toHaveText("250\n", {
    timeout: 90000,
  });
  await expect(
    page.getByRole("complementary", { name: "Tor hologram tutor" }),
  ).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
});
test("else Tab Tab expands, comment shortcut works and toolbox searches all new controls", async ({
  page,
}) => {
  await page.goto("/#playground");
  const editor = page.getByRole("textbox", {
    name: "C# code editor",
    exact: true,
  });
  await editor.fill("else");
  await editor.press("Tab");
  await editor.press("Tab");
  await expect(editor.locator(".cm-line")).toHaveCount(4);
  await expect(editor).toContainText("{");
  await expect(page.locator(".xp-pill")).toContainText("20 XP");
  await editor.fill('Console.WriteLine("Hi");');
  await editor.press("Control+k");
  await editor.press("Control+c");
  await expect(editor).toContainText("//");
  await expect(page.locator(".xp-pill")).toContainText("40 XP");
  await page.goto("/#designer");
  for (const type of [
    "LinkLabel",
    "TrackBar",
    "DateTimePicker",
    "Panel",
    "GroupBox",
  ]) {
    await page.getByLabel("Search toolbox").fill(type);
    await expect(
      page.getByRole("button", { name: type, exact: true }),
    ).toBeVisible();
  }
  await page.getByLabel("Search toolbox").fill("not-a-control");
  await expect(page.locator(".toolbox>button[aria-pressed]")).toHaveCount(0);
});
test("slider and date values are available to real C# form handlers and custom classes", async ({
  page,
}) => {
  let controls = [];
  for (const type of ["TrackBar", "DateTimePicker", "Label", "Button"])
    controls = addControl(controls, type);
  controls[0].eventValueChanged = "slider_Changed";
  controls[1].eventValueChanged = "date_Changed";
  Object.assign(controls[3], { text: "Read values", eventClick: "read_Click" });
  await page.addInitScript(
    ({ controls }) => {
      localStorage.setItem("cq-form", JSON.stringify(controls));
      localStorage.setItem(
        "cq-source-files",
        JSON.stringify([
          {
            path: "Account.cs",
            text: "public class Account { public int Amount {get;set;} }",
          },
        ]),
      );
      localStorage.setItem(
        "cq-practical-code",
        'private void slider_Changed(object sender, EventArgs e) { label1.Text=\"Slider: \"+trackbar1.Value; } private void date_Changed(object sender, EventArgs e) { label1.Text=\"Date: \"+datetimepicker1.Value.ToString(\"yyyy-MM-dd\"); } private void read_Click(object sender, EventArgs e) { var a=new Account(); a.Amount=trackbar1.Value; label1.Text=a.Amount+" / "+datetimepicker1.Value.ToString("yyyy-MM-dd"); }',
      );
    },
    { controls },
  );
  await page.goto("/#designer");
  await expect(
    page.getByRole("button", { name: "Start / F5", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("F5");
  const app = page.getByRole("dialog", { name: "Running Form1 application" });
  await app.getByRole("slider", { name: "trackbar1" }).press("End");
  await expect(app).toContainText("Slider: 100", { timeout: 90000 });
  await app.getByLabel("datetimepicker1").fill("2026-10-09");
  await expect(app).toContainText("Date: 2026-10-09", { timeout: 90000 });
  await app.getByRole("button", { name: "Read values" }).click();
  await expect(app).toContainText("100 / 2026-10-09", { timeout: 90000 });
});

test("container children follow movement, use C# Controls and inherit visibility", async ({
  page,
}) => {
  let controls = addControl([], "GroupBox");
  controls = addControl(controls, "Label");
  controls = addControl(controls, "Label");
  controls = addControl(controls, "Button");
  Object.assign(controls[0], { x: 24, y: 24 });
  Object.assign(controls[1], {
    x: 48,
    y: 70,
    parentId: controls[0].id,
    text: "Inside",
  });
  Object.assign(controls[2], { x: 24, y: 205, text: "Result" });
  Object.assign(controls[3], {
    x: 24,
    y: 250,
    text: "Hide group",
    eventClick: "hide_Click",
  });
  await page.addInitScript(
    ({ controls }) => {
      localStorage.setItem("cq-form", JSON.stringify(controls));
      localStorage.setItem(
        "cq-practical-code",
        "private void hide_Click(object sender, EventArgs e) { label2.Text=groupbox1.Controls.Count.ToString(); groupbox1.Visible=false; }",
      );
    },
    { controls },
  );
  await page.goto("/#designer");
  await page
    .getByRole("button", { name: "Select groupbox1", exact: true })
    .click();
  await page.keyboard.press("ArrowRight");
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("cq-form")),
  );
  expect(saved[1].x).toBe(56);
  await page.getByRole("button", { name: "Start / F5", exact: true }).click();
  const app = page.getByRole("dialog", { name: "Running Form1 application" });
  await expect(app.getByText("Inside", { exact: true })).toBeVisible();
  await app.getByRole("button", { name: "Hide group", exact: true }).click();
  await expect(app.getByText("1", { exact: true })).toBeVisible({
    timeout: 90000,
  });
  await expect(app.getByText("Inside", { exact: true })).toHaveCount(0);
});

test("creating a default event switches from an extra class back to Form1 code", async ({
  page,
}) => {
  await page.goto("/#designer");
  await page
    .getByRole("button", { name: "Add class / C# item", exact: true })
    .click();
  await page.getByLabel("Class name", { exact: true }).fill("Account");
  await page
    .getByRole("button", { name: "Create C# file", exact: true })
    .click();
  await expect(page.getByLabel("Active C# file")).toHaveValue("Account.cs");
  await page
    .getByLabel("WinForms workspace files")
    .getByRole("button", { name: "Form1.cs [Design]", exact: true })
    .click();
  await page.getByRole("button", { name: "Button", exact: true }).dblclick();
  await page
    .getByRole("button", { name: "Select button1", exact: true })
    .dblclick();
  await expect(page.getByLabel("Active C# file")).toHaveValue("Form1.cs");
  await expect(
    page.getByRole("textbox", { name: "Form1.cs event code", exact: true }),
  ).toContainText("button1_Click");
});
