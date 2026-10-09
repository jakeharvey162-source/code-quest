import { test, expect } from "@playwright/test";
import { addControl } from "../src/designer-engine.mjs";
import AxeBuilder from "@axe-core/playwright";
test("F5 opens a separate operable app, can move and close, preserves the draft", async ({
  page,
}) => {
  let controls = addControl([], "TextBox");
  controls[0].name = "txtName";
  controls = addControl(controls, "Label");
  controls[1].name = "lblResult";
  controls[1].text = "Waiting";
  controls = addControl(controls, "Button");
  controls[2].name = "btnGreet";
  controls[2].text = "Greet";
  controls[2].eventClick = "btnGreet_Click";
  const code =
    'private void btnGreet_Click(object sender, EventArgs e) { lblResult.Text = "Hello " + txtName.Text; }';
  await page.addInitScript(
    ({ controls, code }) => {
      localStorage.setItem("cq-form", JSON.stringify(controls));
      localStorage.setItem("cq-practical-code", code);
    },
    { controls, code },
  );
  await page.goto("/#designer");
  await page
    .getByRole("button", { name: "Select lblResult", exact: true })
    .click();
  await expect(page.getByLabel("Control x", { exact: true })).toHaveValue(
    String(controls[1].x),
  );
  await page.keyboard.press("F5");
  const app = page.getByRole("dialog", { name: "Running Form1 application" });
  await expect(app).toBeVisible();
  await expect(app).toHaveCSS("position", "fixed");
  await expect(page.getByLabel("Control Text", { exact: true })).toBeDisabled();
  const x = (await app.boundingBox()).x;
  await app
    .getByRole("button", { name: "Move running form window" })
    .press("ArrowRight");
  expect((await app.boundingBox()).x).toBe(x + 16);
  await app.getByRole("textbox", { name: "txtName", exact: true }).fill("Jake");
  await app.getByRole("textbox", { name: "txtName", exact: true }).press("Tab");
  await expect(
    app.getByRole("button", { name: "Greet", exact: true }),
  ).toBeFocused();
  await app.getByRole("button", { name: "Greet", exact: true }).click();
  await expect(app).toContainText("Hello Jake", { timeout: 90000 });
  await expect(app.locator(".runtime-output")).toContainText(
    "btnGreet_Click executed.",
  );
  const a11y = await new AxeBuilder({ page })
    .include(".runtime-window")
    .analyze();
  expect(
    a11y.violations.filter((v) => ["critical", "serious"].includes(v.impact)),
  ).toEqual([]);
  await page.getByRole("button", { name: "Open Tor tutor" }).click();
  const tor = page.getByRole("complementary", { name: "Tor hologram tutor" });
  await tor.getByLabel("Speak replies automatically").uncheck();
  await tor
    .getByLabel("Ask about C# or your form")
    .fill("type Harvey into txtName");
  await tor.getByRole("button", { name: "Explain", exact: true }).click();
  await expect(
    app.getByRole("textbox", { name: "txtName", exact: true }),
  ).toHaveValue("Harvey");
  await tor.getByLabel("Ask about C# or your form").fill("click btnGreet");
  await tor.getByRole("button", { name: "Explain", exact: true }).click();
  await expect(app).toContainText("Hello Harvey", { timeout: 90000 });
  await app.getByRole("button", { name: "Close running form" }).click();
  await expect(app).toHaveCount(0);
  await expect(page.locator(".form-canvas")).toContainText("Waiting");
  await expect(page.getByLabel("Control Text", { exact: true })).toBeEnabled();
  await page.keyboard.press("F5");
  await expect(app).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(app).toHaveCount(0);
});
test("Tor sees manual caption changes, reacts with a face and honours quiet mode", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/#designer");
  await page.getByRole("button", { name: "Open Tor tutor" }).click();
  const tor = page.getByRole("complementary", { name: "Tor hologram tutor" });
  await tor.getByLabel("Speak replies automatically").uncheck();
  await page.getByRole("button", { name: "Label", exact: true }).dblclick();
  await expect(tor.getByLabel("What Tor sees")).toContainText("label1");
  await page.getByLabel("Control Text", { exact: true }).fill("Student Name");
  await expect(tor.locator(".tor-reply")).toContainText("caption change");
  await expect(tor).toHaveAttribute("data-mood", "happy");
  await tor.getByLabel("Ask about C# or your form").fill("What do you see?");
  await tor.getByRole("button", { name: "Explain", exact: true }).click();
  await expect(tor.locator(".tor-reply")).toContainText("Student Name");
  await tor.getByLabel("React to my workspace").uncheck();
  await page.getByLabel("Control Text", { exact: true }).fill("Welcome");
  await expect(tor.getByLabel("What Tor sees")).toContainText("Welcome");
  await expect(tor.locator(".tor-reply")).toContainText("Student Name");
  await expect(tor.getByLabel("African English accent")).toHaveValue("en-ZA");
  await tor.getByLabel("African English accent").selectOption("en-NG");
  await page.reload();
  await page.getByRole("button", { name: "Open Tor tutor" }).click();
  await expect(tor.getByLabel("African English accent")).toHaveValue("en-NG");
  await expect(tor.getByLabel("React to my workspace")).not.toBeChecked();
});
