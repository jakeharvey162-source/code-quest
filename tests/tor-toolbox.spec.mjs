import { test, expect } from "@playwright/test";
test("toolbox selects, places at cursor, cancels and double-clicks once", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/#designer");
  const label = page.getByRole("button", { name: "Label", exact: true });
  await label.click();
  await expect(label).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".placed-control")).toHaveCount(0);
  await page.locator(".form-canvas").click({ position: { x: 173, y: 131 } });
  await expect(page.locator(".placed-control")).toHaveCount(1);
  await expect(page.locator(".placed-control")).toHaveCSS("left", "176px");
  await expect(page.locator(".placed-control")).toHaveCSS("top", "128px");
  await label.click();
  await label.press("Escape");
  await expect(label).toHaveAttribute("aria-pressed", "false");
  await label.dblclick();
  await expect(page.locator(".placed-control")).toHaveCount(2);
});
test("Tor moves, remembers position, explains controls and speaks with optional roast", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.SpeechSynthesisUtterance = class {
      constructor(text) {
        this.text = text;
      }
    };
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        cancel() {},
        getVoices() {
          return [];
        },
        speak(u) {
          window.torSpoken = u.text;
          setTimeout(() => u.onstart?.(), 0);
        },
      },
    });
  });
  await page.goto("/#designer");
  const tor = page.getByRole("complementary", { name: "Tor hologram tutor" });
  await expect(tor).toBeVisible();
  const handle = page.getByRole("button", { name: "Move Tor hologram" });
  const before = await tor.boundingBox();
  await handle.press("ArrowLeft");
  expect((await tor.boundingBox()).x).toBe(before.x - 16);
  const bounds = await handle.boundingBox();
  await page.mouse.move(bounds.x + 30, bounds.y + 10);
  await page.mouse.down();
  await page.mouse.move(bounds.x - 120, bounds.y - 140, { steps: 6 });
  await page.mouse.up();
  const moved = await tor.boundingBox();
  expect(moved.x).toBeLessThan(before.x - 100);
  await page.reload();
  expect((await tor.boundingBox()).x).toBe(moved.x);
  await page.getByRole("button", { name: "Open Tor tutor" }).click();
  await page
    .getByLabel("Ask about C# or your form")
    .fill("What does a label do?");
  await page.getByRole("button", { name: "Explain", exact: true }).click();
  await expect(page.locator(".tor-reply")).toContainText(
    "A Label displays information",
  );
  await expect(page.getByLabel("Roast mode")).not.toBeChecked();
  await page.getByLabel("Roast mode").check();
  await expect(page.locator(".tor-reply")).toContainText(
    "semicolon went on holiday",
  );
  await page.getByRole("button", { name: "Tor, speak" }).click();
  await expect(page.locator(".tor-coach")).toHaveClass(/speaking/);
  expect(await page.evaluate(() => window.torSpoken)).toContain(
    "A Label displays information",
  );
  await tor.getByRole("button", { name: "Stop voice", exact: true }).click();
  await expect(tor).toContainText("Reading stopped.");
});
