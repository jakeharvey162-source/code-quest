import { test, expect } from "@playwright/test";
import { addControl } from "../src/designer-engine.mjs";
for (const type of ["Button", "Label"])
  test(`${type} double-click opens and focuses its C# event without duplicating it`, async ({
    page,
  }) => {
    await page.addInitScript(
      (controls) => localStorage.setItem("cq-form", JSON.stringify(controls)),
      addControl([], type),
    );
    await page.goto("/#designer");
    const name = type.toLowerCase() + "1";
    await page
      .getByRole("button", { name: "Select " + name, exact: true })
      .dblclick();
    const editor = page.getByRole("textbox", {
      name: "Form1.cs event code",
      exact: true,
    });
    await expect(editor).toContainText(`void ${name}_Click(`);
    await expect(editor).toBeFocused();
    await page.keyboard.press("Shift+F7");
    await page
      .getByRole("button", { name: "Select " + name, exact: true })
      .dblclick();
    await expect(editor).toBeFocused();
    expect(
      (await editor.innerText()).split(`void ${name}_Click(`),
    ).toHaveLength(2);
    await editor.fill(
      `private void ${name}_Click(object sender, EventArgs e) { ${name}.Text = "Clicked successfully"; }`,
    );
    await page.keyboard.press("F5");
    const running = page.getByRole("dialog", {
      name: "Running Form1 application",
    });
    await running.getByText(name, { exact: true }).click();
    await expect(running).toContainText("Clicked successfully", {
      timeout: 90000,
    });
  });
test("colour edits render accurately and survive refresh and running the form", async ({
  page,
}) => {
  await page.addInitScript(
    (controls) => {
      if (!localStorage.getItem("cq-form"))
        localStorage.setItem("cq-form", JSON.stringify(controls));
    },
    addControl([], "Button"),
  );
  await page.goto("/#designer");
  await page
    .getByRole("button", { name: "Select button1", exact: true })
    .click();
  await page.getByLabel("Foreground colour", { exact: true }).fill("#ffffff");
  await page.getByLabel("Background colour", { exact: true }).fill("#123abc");
  const control = page.locator(".design-surface button");
  await expect(control).toHaveCSS("background-color", "rgb(18, 58, 188)");
  await expect(control).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(control).toHaveCSS("opacity", "1");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(control).not.toHaveCSS("background-color", "rgb(18, 58, 188)");
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(control).toHaveCSS("background-color", "rgb(18, 58, 188)");
  await page.reload();
  await expect(control).toHaveCSS("background-color", "rgb(18, 58, 188)");
  await page.keyboard.press("F5");
  const runtime = page.getByRole("dialog", {
    name: "Running Form1 application",
  });
  await expect(
    runtime.getByRole("button", { name: "button1", exact: true }),
  ).toHaveCSS("background-color", "rgb(18, 58, 188)");
});
for (const width of [360, 412])
  test(`Android ${width}px Tor stays bounded and minimises without covering navigation`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.addInitScript(() =>
      localStorage.setItem(
        "cq-tor-position",
        JSON.stringify({ x: 900, y: 50 }),
      ),
    );
    await page.goto("/#home");
    const tor = page.getByRole("complementary", { name: "Tor hologram tutor" });
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    let box = await tor.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(box.y).toBeGreaterThan(
      (await nav.boundingBox()).y + (await nav.boundingBox()).height,
    );
    await page.getByRole("button", { name: "Open Tor tutor" }).click();
    box = await tor.boundingBox();
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(800);
    await tor.getByLabel("Ask about C# or your form").fill("What is a label?");
    await page.screenshot({
      path: `test-results/android-${width}-tor-open.png`,
    });
    await page.getByRole("button", { name: "Minimise Tor" }).click();
    await expect(tor.locator(".tor-panel")).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 2,
      ),
    ).toBe(false);
    await page.screenshot({
      path: `test-results/android-${width}-world.png`,
      fullPage: true,
    });
  });

test("touch double-tap on a label opens its event code", async ({
  browser,
}) => {
  const context = await browser.newContext({
    hasTouch: true,
    viewport: { width: 412, height: 915 },
  });
  try {
    const page = await context.newPage();
    await page.addInitScript(
      (controls) => {
        localStorage.setItem("cq-form", JSON.stringify(controls));
        window.__cqLabelTapTimes = [];
        document.addEventListener("pointerup", (event) => {
          if (
            event.pointerType === "touch" &&
            event.target.closest?.('[aria-label="Select label1"]')
          )
            window.__cqLabelTapTimes.push(Date.now());
        }, true);
      },
      addControl([], "Label"),
    );
    await page.goto("/#designer");
    const control = page.getByRole("button", {
      name: "Select label1",
      exact: true,
    });
    // Locator actionability checks between taps can exceed the gesture window.
    // Resolve its position once, then send an actual consecutive touch gesture.
    await control.scrollIntoViewIfNeeded();
    const bounds = await control.boundingBox();
    expect(bounds).not.toBeNull();
    const x = bounds.x + bounds.width / 2;
    const y = bounds.y + bounds.height / 2;
    await page.touchscreen.tap(x, y);
    await page.touchscreen.tap(x, y);
    const tapTimes = await page.evaluate(() => window.__cqLabelTapTimes);
    expect(tapTimes).toHaveLength(2);
    expect(tapTimes[1] - tapTimes[0]).toBeLessThan(450);
    await expect(
      page.getByRole("textbox", { name: "Form1.cs event code", exact: true }),
    ).toContainText("void label1_Click(");
  } finally {
    await context.close();
  }
});

test("phone navigation hides Classroom until an account signs in", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/#home");
  await page.getByRole("button", { name: "All tools", exact: true }).click();
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(nav.getByRole("button", { name: "Classroom", exact: true })).toHaveCount(0);
  await expect(nav.getByRole("button", { name: "Community chat", exact: true })).toHaveCount(0);
  await expect(nav.getByRole("button", { name: "Private chats", exact: true })).toHaveCount(0);
  await page.goto("/#classes");
  await expect(page.getByRole("heading", { name: "Join CodeQuest to connect" })).toBeVisible();
  await page.getByRole("button", { name: "Create account or sign in" }).click();
  await expect(page).toHaveURL(/#account$/);
});
