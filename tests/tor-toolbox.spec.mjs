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
        addEventListener() {},
        removeEventListener() {},
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
    "Less guessing, more debugging",
  );
  await page.getByRole("button", { name: "Tor, speak" }).click();
  await expect(page.locator(".tor-coach")).toHaveClass(/speaking/);
  expect(await page.evaluate(() => window.torSpoken)).toContain(
    "A Label displays information",
  );
  await tor.getByRole("button", { name: "Stop voice", exact: true }).click();
  await expect(tor).toContainText("Reading stopped.");
});

test("student talks to Tor to edit, review and run a form with spoken replies", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => {
    window.torSpoken = [];
    window.SpeechSynthesisUtterance = class {
      constructor(text) {
        this.text = text;
      }
    };
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        getVoices: () => [
          { name: "Google English", lang: "en-US", voiceURI: "google" },
        ],
        addEventListener() {},
        removeEventListener() {},
        cancel() {},
        speak(u) {
          window.torSpoken.push(u.text);
          setTimeout(() => u.onend?.(), 0);
        },
      },
    });
    window.SpeechRecognition = class {
      start() {
        this.onstart?.();
        if (window.torDenied) {
          this.onerror?.({ error: "not-allowed" });
          this.onend?.();
          return;
        }
        setTimeout(() => {
          this.onresult?.({
            results: [[{ transcript: window.torTranscript }]],
          });
          this.onend?.();
        }, 0);
      }
      abort() {
        this.onend?.();
      }
    };
  });
  await page.goto("/#designer");
  await page.getByRole("button", { name: "Open Tor tutor" }).click();
  const tor = page.getByRole("complementary", { name: "Tor hologram tutor" });
  const request = async (text) => {
    await page.evaluate((text) => {
      window.torTranscript = text;
    }, text);
    await tor.getByRole("button", { name: "Talk to Tor", exact: true }).click();
  };
  await request("Tor add a label that says Student Name");
  await expect(page.getByLabel("Control Text", { exact: true })).toHaveValue(
    "Student Name",
  );
  await expect(page.locator(".form-canvas")).toContainText("Student Name");
  await expect(page.locator(".control-tag")).toHaveCount(0);
  await request("set text to Welcome Harvey");
  await expect(page.getByLabel("Control Text", { exact: true })).toHaveValue(
    "Welcome Harvey",
  );
  await request("rename to lblWelcome");
  await expect(page.getByLabel("Control Name", { exact: true })).toHaveValue(
    "lblWelcome",
  );
  await expect(page.locator(".form-canvas")).toContainText("Welcome Harvey");
  await request("review my form");
  await expect(page.locator(".tor-reply")).toContainText(
    "Selected: lblWelcome",
  );
  expect((await page.evaluate(() => window.torSpoken)).at(-1)).toContain(
    "Selected: lblWelcome",
  );
  await request("start preview");
  await expect(
    page.getByRole("button", { name: "Stop debugging", exact: true }),
  ).toBeVisible();
  await request("stop preview");
  await expect(
    page.getByRole("button", { name: "Start / F5", exact: true }),
  ).toBeVisible();
  await request("rename to Student Name");
  await expect(page.locator(".tor-reply")).toContainText(
    "isn't a valid unique C# Name",
  );
  await page.evaluate(() => {
    window.torDenied = true;
  });
  await tor.getByRole("button", { name: "Talk to Tor", exact: true }).click();
  await expect(tor).toContainText("Microphone permission was denied");
  await page.evaluate(() => {
    window.torDenied = false;
  });
  await request("move right 24 pixels");
  await expect(page.getByLabel("Control x", { exact: true })).toHaveValue("54");
  await request("undo");
  await expect(page.getByLabel("Control x", { exact: true })).toHaveValue("30");
});
