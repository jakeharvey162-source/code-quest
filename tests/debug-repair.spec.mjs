import { test, expect } from "@playwright/test";
import { debugExercises } from "../src/lib/debug-practice.mjs";
import { freshProgress } from "../src/lib/progress.ts";
async function open(page) {
  const p = freshProgress();
  p.settings.editorMode = "plain";
  await page.addInitScript((p) => {
    if (!localStorage.getItem("cq-progress-v1"))
      localStorage.setItem("cq-progress-v1", JSON.stringify(p));
  }, p);
  await page.goto("/#challenges");
  await page.locator(".repair-lab > summary").click();
}
test("repair missions reject broken starters and accept solutions with real C# edge cases", async ({
  page,
}) => {
  test.setTimeout(240000);
  await open(page);
  const lab = page.locator(".repair-lab");
  for (const mission of debugExercises) {
    await lab.getByLabel("Repair mission").selectOption(mission.id);
    await lab
      .getByRole("button", { name: "Check repairs", exact: true })
      .click();
    await expect(lab.getByRole("status")).toContainText("checks passed.", {
      timeout: 90000,
    });
    await expect(lab.getByRole("status")).not.toContainText(
      "All repair checks passed",
    );
    await lab.getByLabel("Repair C# program").fill(mission.solution);
    await lab
      .getByRole("button", { name: "Check repairs", exact: true })
      .click();
    await expect(lab.getByRole("status")).toContainText(
      "All repair checks passed",
      { timeout: 90000 },
    );
  }
});
test("phone learner traces repeated loop values, uses keyboard replay and retains input and edits", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  const lab = page.locator(".repair-lab");
  await lab.getByLabel("Repair mission").selectOption("statistics");
  await lab.getByLabel("Repair console input").fill("Booked,Completed,Booked");
  await lab.getByRole("button", { name: "Record & trace" }).click();
  await expect(lab.getByRole("status")).toContainText("Recorded 4 snapshots", {
    timeout: 90000,
  });
  await expect(lab.locator("dd")).toHaveText(["Booked", "0"]);
  await lab.getByRole("button", { name: "Step snapshot" }).click();
  await expect(lab.locator("dd")).toHaveText(["Completed", "1"]);
  await page.keyboard.press("F10");
  await expect(lab.locator("dd")).toHaveText(["Booked", "0"]);
  await page.keyboard.press("F9");
  await expect(
    lab.getByRole("checkbox", { name: "Trace line 6", exact: true }),
  ).toBeChecked();
  await lab.getByRole("button", { name: "Restart replay" }).click();
  await page.keyboard.press("F5");
  await expect(lab.locator("dd")).toHaveText(["Completed", "1"]);
  await lab.getByRole("button", { name: "Show final output" }).click();
  await expect(lab.getByRole("log")).toContainText("1");
  const fixed = debugExercises.find((e) => e.id === "statistics").solution;
  await lab.getByLabel("Repair C# program").fill(fixed);
  await expect(
    lab.getByRole("region", { name: "Recorded debugger" }),
  ).toHaveCount(0);
  await lab.getByRole("button", { name: "Run console", exact: true }).click();
  await expect(lab.getByRole("log")).toContainText("2", { timeout: 90000 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 2,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "/tmp/codequest-debug-phone.png",
    fullPage: true,
  });
  await page.reload();
  await page.locator(".repair-lab > summary").click();
  await expect(lab.getByLabel("Repair C# program")).toHaveValue(fixed);
  await expect(lab.getByLabel("Repair console input")).toHaveValue(
    "Booked,Completed,Booked",
  );
});
test("Tor exposes polite announcements and keyboard repositioning instructions", async ({
  page,
}) => {
  await page.goto("/#home");
  const handle = page.getByRole("button", { name: "Move Tor hologram" });
  await expect(handle).toHaveAttribute("aria-describedby", "tor-move-help");
  await handle.focus();
  await page.keyboard.press("ArrowLeft");
  const first = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("cq-tor-position")),
  );
  await page.keyboard.press("ArrowLeft");
  const second = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("cq-tor-position")),
  );
  expect(second.x).toBeLessThan(first.x);
  await page
    .getByRole("button", { name: "Open Tor tutor", exact: true })
    .click();
  await expect(page.locator(".tor-coach [role=status]")).toHaveAttribute(
    "aria-live",
    "polite",
  );
});

test("reported first lesson starter returns wrong-answer feedback after a cold compiler start", async ({
  page,
}) => {
  await page.goto("/#learn/variables");
  await page.getByRole("button", { name: "I’m ready to predict" }).click();
  await page.getByRole("radio").nth(1).check();
  await page.getByRole("button", { name: "Check prediction" }).click();
  await page.getByRole("button", { name: "Build it", exact: true }).click();
  await page.getByRole("button", { name: "Run tests", exact: true }).click();
  await expect(page.locator(".run-feedback")).toContainText(
    "The program compiled, but the tests need another look.",
    { timeout: 90000 },
  );
  await expect(page.locator(".run-feedback")).not.toContainText(
    "infinite loop",
  );
});
test("unavailable speech is rendered in a persistent polite status region", async ({
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
        getVoices: () => [
          { name: "Test English", lang: "en-ZA", voiceURI: "test" },
        ],
        addEventListener() {},
        removeEventListener() {},
        cancel() {},
        speak(u) {
          setTimeout(() => u.onerror?.({ error: "voice-unavailable" }), 0);
        },
      },
    });
  });
  await page.goto("/#home");
  await page
    .getByRole("button", { name: "Open Tor tutor", exact: true })
    .click();
  await page.getByRole("button", { name: "Tor, speak", exact: true }).click();
  const status = page.locator(".tor-coach [role=status]");
  await expect(status).toContainText("No working speech voice is available");
  await expect(status).toHaveAttribute("aria-live", "polite");
  await expect(status).toHaveAttribute("aria-atomic", "true");
});

test("dark phone trace remains readable and passes automated accessibility checks", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await open(page);
  const lab = page.locator(".repair-lab");
  await lab.getByLabel("Repair mission").selectOption("statistics");
  await lab.getByRole("button", { name: "Record & trace" }).click();
  await expect(lab.getByRole("status")).toContainText("Recorded 4 snapshots", {
    timeout: 90000,
  });
  await page.evaluate(() =>
    document.documentElement.setAttribute("data-theme", "dark"),
  );
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  const scan = await new AxeBuilder({ page })
    .include(".repair-lab")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(scan.violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 2,
    ),
  ).toBe(true);
  await page.evaluate(()=>{if(document.activeElement instanceof HTMLElement)document.activeElement.blur();});
  await lab.getByRole("region", { name: "Recorded debugger" }).evaluate(el=>el.scrollIntoView({block:"start"}));
  await page.screenshot({ path: "/tmp/codequest-debug-trace.png" });
});
