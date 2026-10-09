import { test, expect } from "@playwright/test";
import { zipSync, strToU8 } from "fflate";
import { addControl } from "../src/designer-engine.mjs";
import { projectZip } from "../src/lib/project-export.mjs";
test("student opens ZIP, reads source and runs the selected C#", async ({
  page,
}) => {
  await page.goto("/#playground");
  await page.getByText("Open ZIP / project files", { exact: true }).click();
  await page
    .getByLabel("Choose project file")
    .setInputFiles({
      name: "student.zip",
      mimeType: "application/zip",
      buffer: Buffer.from(
        zipSync({
          "Program.cs": strToU8(
            'using System; Console.WriteLine("ZIP works");',
          ),
          "brief.txt": strToU8("Build a program"),
        }),
      ),
    });
  await expect(
    page.getByRole("status").filter({ hasText: "readable files loaded" }),
  ).toBeVisible();
  await page
    .getByLabel("Project file", { exact: true })
    .selectOption({ label: "Program.cs" });
  await expect(page.getByLabel("Uploaded file contents")).toContainText(
    "ZIP works",
  );
  await page
    .getByRole("button", { name: "Open selected C# in editor" })
    .click();
  await page.getByRole("button", { name: "Run C#", exact: true }).click();
  await expect(page.locator(".run-feedback")).toContainText("ZIP works", {
    timeout: 90000,
  });
});
test("student restores exported form and keeps undo, label text, preview and numeric bounds", async ({
  page,
}) => {
  let controls = addControl([], "Label");
  controls[0].text = "Student name";
  controls = addControl(controls, "NumericUpDown");
  controls[1].minimum = 1;
  controls[1].maximum = 10;
  controls[1].value = 5;
  await page.goto("/#designer");
  await page.getByRole("button", { name: "TextBox", exact: true }).dblclick();
  await page.getByText("Open ZIP / project files", { exact: true }).click();
  await page
    .getByLabel("Choose project file")
    .setInputFiles({
      name: "form.zip",
      mimeType: "application/zip",
      buffer: Buffer.from(
        projectZip(controls, { handlerCode: "// saved handler" }),
      ),
    });
  await page
    .getByLabel("Project file", { exact: true })
    .selectOption({ label: "codequest-form.json" });
  await page.getByRole("button", { name: "Restore form from project" }).click();
  await expect(page.locator(".placed-control")).toHaveCount(2);
  await expect(page.locator(".form-canvas")).toContainText("Student name");
  await page.getByRole("button", { name: "Start / F5", exact: true }).click();
  await page.getByRole("spinbutton", { name: "numericupdown1" }).fill("99");
  await expect(
    page.getByRole("spinbutton", { name: "numericupdown1" }),
  ).toHaveValue("10");
  await page
    .getByRole("button", { name: "Stop debugging", exact: true })
    .click();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator(".placed-control")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Select textbox1", exact: true })
    .focus();
  await page.keyboard.press("Delete");
  await expect(page.locator(".placed-control")).toHaveCount(0);
  await page.locator(".designer-page").click({ position: { x: 5, y: 5 } });
  await page.keyboard.press("Control+z");
  await expect(page.locator(".placed-control")).toHaveCount(1);
});
test("student runs real C# button logic and sees textbox validation, label and Items changes", async ({
  page,
}) => {
  let controls = addControl([], "TextBox");
  controls[0].name = "txtName";
  controls = addControl(controls, "Label");
  controls[1].name = "lblResult";
  controls = addControl(controls, "ListBox");
  controls[2].name = "lstNames";
  controls = addControl(controls, "Button");
  controls[3].name = "btnSave";
  controls[3].eventClick = "btnSave_Click";
  const code = `private void btnSave_Click(object sender, EventArgs e) {
    if (string.IsNullOrWhiteSpace(txtName.Text)) { MessageBox.Show("Enter your name"); return; }
    lblResult.Text = "Hello " + txtName.Text;
    lstNames.Items.Add(txtName.Text);
    txtName.Clear();
  }`;
  await page.addInitScript(
    ({ controls, code }) => {
      localStorage.setItem("cq-form", JSON.stringify(controls));
      localStorage.setItem("cq-practical-code", code);
    },
    { controls, code },
  );
  await page.goto("/#designer");
  await page.getByRole("button", { name: "Start / F5", exact: true }).click();
  await page
    .locator(".form-canvas")
    .getByRole("button", { name: "button1", exact: true })
    .click();
  await expect(page.locator(".form-validation")).toContainText(
    "Enter your name",
    { timeout: 15000 },
  );
  await expect(
    page.getByRole("alertdialog", { name: "MessageBox" }),
  ).toContainText("Enter your name");
  await page
    .getByRole("alertdialog", { name: "MessageBox" })
    .getByRole("button", { name: "OK", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "txtName", exact: true })
    .fill("Harvey");
  await page
    .locator(".form-canvas")
    .getByRole("button", { name: "button1", exact: true })
    .click();
  await expect(page.locator(".form-canvas")).toContainText("Hello Harvey", {
    timeout: 90000,
  });
  await expect(
    page.getByRole("textbox", { name: "txtName", exact: true }),
  ).toHaveValue("");
  await expect(
    page.getByRole("listbox", { name: "lstNames", exact: true }),
  ).toContainText("Harvey");
  await page
    .getByRole("button", { name: "Stop debugging", exact: true })
    .click();
  await expect(page.locator(".form-canvas")).toContainText("label1");
});
