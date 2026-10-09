import { test, expect } from "@playwright/test";
import { addControl } from "../src/designer-engine.mjs";
test("DataGridView editing and selection, RichTextBox and ProgressBar use actual C# events", async ({
  page,
}) => {
  let controls = [];
  for (const type of [
    "DataGridView",
    "Label",
    "RichTextBox",
    "ProgressBar",
    "Button",
  ])
    controls = addControl(controls, type);
  Object.assign(controls[0], {
    name: "dgvAccounts",
    columns: "Customer|Customer\nBalance|Balance",
    gridRows: '[["Ada","500"]]',
    readOnly: false,
    eventSelectionChanged: "dgvAccounts_SelectionChanged",
    x: 24,
    y: 24,
    width: 440,
    height: 150,
  });
  Object.assign(controls[1], {
    name: "lblName",
    text: "Select a customer",
    x: 24,
    y: 185,
    width: 200,
  });
  Object.assign(controls[2], {
    name: "rtbNotes",
    text: "Account notes",
    x: 24,
    y: 230,
    width: 200,
    height: 90,
  });
  Object.assign(controls[3], {
    name: "prgProgress",
    x: 250,
    y: 230,
    width: 180,
    value: 25,
  });
  Object.assign(controls[4], {
    name: "btnUpdate",
    text: "Update balance",
    x: 250,
    y: 285,
    width: 180,
    eventClick: "btnUpdate_Click",
  });
  const code = `private void dgvAccounts_SelectionChanged(object sender, EventArgs e) { if (dgvAccounts.CurrentRow != null) lblName.Text = Convert.ToString(dgvAccounts.CurrentRow.Cells["Customer"].Value, System.Globalization.CultureInfo.InvariantCulture); }
private void btnUpdate_Click(object sender, EventArgs e) { decimal amount=decimal.Parse(Convert.ToString(dgvAccounts.Rows[0].Cells["Balance"].Value, System.Globalization.CultureInfo.InvariantCulture)); dgvAccounts.Rows[0].Cells["Balance"].Value=amount+50m; rtbNotes.Text="Balance updated"; prgProgress.Value=75; }`;
  await page.addInitScript(
    ({ controls, code }) => {
      localStorage.setItem("cq-form", JSON.stringify(controls));
      localStorage.setItem("cq-practical-code", code);
    },
    { controls, code },
  );
  await page.goto("/#designer");
  await page.getByRole("button", { name: "Start / F5", exact: true }).click();
  const app = page.getByRole("dialog", { name: "Running Form1 application" });
  const balance = app.getByRole("textbox", {
    name: "dgvAccounts row 1 Balance",
    exact: true,
  });
  await balance.focus();
  await expect(app).toContainText("Ada", { timeout: 90000 });
  await expect(app.locator(".runtime-output")).toContainText(
    "dgvAccounts_SelectionChanged executed.",
    { timeout: 90000 },
  );
  await expect(balance).toBeEnabled();
  await balance.fill("750");
  await app
    .getByRole("button", { name: "Update balance", exact: true })
    .click();
  await expect(balance).toHaveValue("800", { timeout: 90000 });
  await expect(
    app.getByRole("textbox", { name: "rtbNotes", exact: true }),
  ).toHaveValue("Balance updated");
  await expect(
    app.getByRole("progressbar", { name: "prgProgress", exact: true }),
  ).toHaveAttribute("value", "75");
  await page.keyboard.press("Shift+F5");
  await expect(app).toHaveCount(0);
  expect(
    JSON.parse(await page.evaluate(() => localStorage.getItem("cq-form")))[0]
      .gridRows,
  ).toBe('[["Ada","500"]]');
});
