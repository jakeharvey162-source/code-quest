import { test, expect } from "@playwright/test";
import { lessons } from "../src/curriculum.ts";
import AxeBuilder from "@axe-core/playwright";
import { freshProgress } from "../src/lib/progress.ts";
async function plainEditor(page) {
  await page.addInitScript(
    (state) => {
      if (!localStorage.getItem("cq-progress-v1"))
        localStorage.setItem("cq-progress-v1", JSON.stringify(state));
    },
    {
      ...freshProgress(),
      settings: { ...freshProgress().settings, editorMode: "plain" },
    },
  );
}
test("all real C# lesson solutions compile and produce expected test outputs", async ({
  page,
}) => {
  test.setTimeout(240000);
  await page.goto("/");
  const cases = lessons
    .filter((l) => l.kind === "code")
    .flatMap((l) =>
      [l.build, l.apply].map((c, i) => ({
        name: l.id + ":" + i,
        source:
          "using System;\nusing System.Collections.Generic;\n" +
          c.harness +
          "\n" +
          c.solution,
        expected: c.expected,
      })),
    );
  const results = await page.evaluate(async (cases) => {
    const { WasmSharpModule } = await import("/compiler/index.js");
    const runtime = await WasmSharpModule.initializeAsync();
    const results = [];
    for (const c of cases) {
      const compilation = await runtime.createCompilationAsync(c.source);
      const result = await compilation.run();
      results.push({ name: c.name, ...result });
    }
    return results;
  }, cases);
  for (let i = 0; i < cases.length; i++) {
    expect(results[i].success, JSON.stringify(results[i])).toBe(true);
    expect(results[i].stdOut.trim().replace(/\r/g, ""), cases[i].name).toBe(
      cases[i].expected,
    );
  }
});
test("learner completes all five stages with real compilation, no replay XP", async ({
  page,
}) => {
  await plainEditor(page);
  await page.goto("/#learn/variables");
  await page.getByRole("button", { name: "I’m ready to predict" }).click();
  await page.getByRole("radio").nth(1).check();
  await page.getByRole("button", { name: "Check prediction" }).click();
  await page.getByRole("button", { name: "Build it" }).click();
  const lesson = lessons.find((l) => l.id === "variables");
  await page
    .getByRole("textbox", { name: "C# code editor" })
    .fill("invalid c sharp");
  await page.getByRole("button", { name: "Run tests", exact: true }).click();
  await expect(page.locator(".run-feedback")).toContainText("CS", {
    timeout: 90000,
  });
  await page
    .getByRole("textbox", { name: "C# code editor" })
    .fill(lesson.build.solution);
  await page.getByRole("button", { name: "Run tests", exact: true }).click();
  await expect(page.locator(".run-feedback")).toContainText(
    "All test cases passed",
  );
  await page.getByRole("button", { name: "Next stage" }).click();
  await page
    .getByRole("textbox", { name: "C# code editor" })
    .fill(lesson.build.solution);
  await page.getByRole("button", { name: "Run tests", exact: true }).click();
  await expect(page.locator(".run-feedback")).toContainText(
    "All test cases passed",
  );
  await page.getByRole("button", { name: "Next stage" }).click();
  await page
    .getByRole("textbox", { name: "C# code editor" })
    .fill(lesson.apply.solution);
  await page.getByRole("button", { name: "Run tests", exact: true }).click();
  await expect(
    page.getByText("Quest complete.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".xp-pill")).toContainText("160 XP");
  await page.getByRole("button", { name: "Run tests", exact: true }).click();
  await expect(page.locator(".run-feedback")).toContainText(
    "All test cases passed",
  );
  await expect(page.locator(".xp-pill")).toContainText("160 XP");
  await page.reload();
  await expect(
    page.getByText("Quest complete.", { exact: true }),
  ).toBeVisible();
});
test("scratchpad runs actual C#, reports errors and stops infinite loops", async ({
  page,
}) => {
  await plainEditor(page);
  await page.goto("/#playground");
  await page
    .getByRole("textbox", { name: "C# code editor" })
    .fill("using System; Console.WriteLine(6 * 7);");
  await page.getByRole("button", { name: "Run C#", exact: true }).click();
  await expect(page.locator(".run-feedback")).toContainText("42", {
    timeout: 90000,
  });
  await page
    .getByRole("textbox", { name: "C# code editor" })
    .fill("using System; while(true) {}");
  await page.getByRole("button", { name: "Run C#", exact: true }).click();
  await expect(page.locator(".run-feedback")).toContainText("10 seconds", {
    timeout: 25000,
  });
  await page
    .getByRole("textbox", { name: "C# code editor" })
    .fill('using System; Console.WriteLine("Recovered");');
  await page.getByRole("button", { name: "Run C#", exact: true }).click();
  await expect(page.locator(".run-feedback")).toContainText("Recovered", {
    timeout: 90000,
  });
});
test("designer CRUD, properties, preview, undo and native ZIP export", async ({
  page,
}) => {
  await page.goto("/#designer");
  await page.getByRole("button", { name: "TextBox", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Control Name", exact: true })
    .fill("txtName");
  await page
    .getByRole("textbox", { name: "Control Text", exact: true })
    .fill("Ada");
  await page.getByRole("button", { name: "Button", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Control Name", exact: true })
    .fill("btnSave");
  await page
    .getByRole("textbox", { name: "Click handler", exact: true })
    .fill("btnSave_Click");
  await page.getByRole("button", { name: "Preview form", exact: true }).click();
  await page
    .getByRole("textbox", { name: "txtName", exact: true })
    .fill("Lebo");
  await page
    .getByRole("button", { name: "Button", exact: true })
    .last()
    .click();
  await expect(page.locator(".form-validation")).toContainText("btnSave_Click");
  await page.getByRole("button", { name: "Back to design" }).click();
  await page
    .getByRole("combobox", { name: "Selected control" })
    .selectOption("textbox1");
  await page.getByRole("button", { name: "Remove control" }).click();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator(".placed-control")).toHaveCount(2);
  await page
    .getByRole("combobox", { name: "Selected control" })
    .selectOption("button1");
  const d = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Windows project" }).click();
  expect((await d).suggestedFilename()).toBe("CodeQuestForms.zip");
  await page.reload();
  await expect(page.locator(".placed-control")).toHaveCount(2);
});
test("assessment marks unanswered questions and saves history", async ({
  page,
}) => {
  await page.goto("/#assessment");
  await page.getByRole("button", { name: "Start assessment" }).click();
  for (let i = 0; i < 9; i++)
    await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Finish & mark" }).click();
  await expect(
    page.getByRole("heading", { name: "0 / 10", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Progress", exact: true }).click();
  await expect(page.locator(".assessment-history")).toContainText("0 / 10");
});
test("voice selection, read-aloud, stop, permission error and navigation hooks", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.__spoken = [];
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
        addEventListener: () => {},
        removeEventListener: () => {},
        cancel: () => {
          window.__cancelled = true;
        },
        speak: (u) => {
          window.__spoken.push({
            text: u.text,
            voice: u.voice?.name,
            rate: u.rate,
          });
          setTimeout(() => u.onend?.(), 0);
        },
      },
    });
    window.SpeechRecognition = class {
      start() {
        this.onstart?.();
        setTimeout(() => this.onerror?.({ error: "not-allowed" }), 0);
      }
      abort() {
        this.onend?.();
      }
    };
  });
  await page.goto("/#settings");
  await page
    .getByRole("combobox", { name: "Device voice" })
    .selectOption("Test English");
  await page.getByRole("button", { name: "Read aloud", exact: true }).click();
  expect(await page.evaluate(() => window.__spoken[0].voice)).toBe(
    "Test English",
  );
  await page.getByRole("button", { name: "Stop voice", exact: true }).click();
  expect(await page.evaluate(() => window.__cancelled)).toBe(true);
  await page.getByLabel("Enable voice commands").check();
  await page.getByRole("button", { name: "World", exact: true }).click();
  await page
    .getByRole("button", { name: "Voice command", exact: true })
    .click();
  await expect(page.locator(".voice-status")).toContainText(
    "permission was denied",
  );
});
test("backup restore, invalid file rejection and corrupt progress recovery", async ({
  page,
}) => {
  await page.goto("/#settings");
  await page.getByLabel("Your name", { exact: true }).fill("Ada");
  const d = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export backup" }).click();
  expect((await d).suggestedFilename()).toBe("CodeQuest-backup.json");
  await page.getByLabel("Restore backup", { exact: true }).setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"format":"fake"}'),
  });
  await expect(page.locator(".settings-status")).toContainText("not a valid");
  await page.getByLabel("Restore backup", { exact: true }).setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "codequest-backup-v1",
        progress: {
          ...freshProgress(),
          settings: { ...freshProgress().settings, name: "Lebo" },
        },
        controls: [],
      }),
    ),
  });
  await expect(page.getByLabel("Your name", { exact: true })).toHaveValue(
    "Lebo",
  );
  await page.evaluate(() => {
    localStorage.setItem("cq-progress-v1", "{broken");
    localStorage.setItem("cq-form", "{broken");
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Make it feel like you." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "WinForms", exact: true }).click();
  await expect(page.getByText("Your idea starts here")).toBeVisible();
});
test("all routes fit a phone and have no serious accessibility errors", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "home",
    "learn",
    "designer",
    "assessment",
    "progress",
    "settings",
    "playground",
    "account",
    "classes",
  ]) {
    await page.goto("/#" + route);
    await page.locator(".page h1").waitFor();
    await expect(page.locator(".app-sidebar nav")).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow, route).toBe(false);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations.filter((v) =>
        ["serious", "critical"].includes(v.impact),
      ),
      route + " " + JSON.stringify(results.violations),
    ).toEqual([]);
  }
  expect(errors).toEqual([]);
  await page.goto("/");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "test-results/codequest-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/codequest-mobile.png",
    fullPage: true,
  });
});
test("production app loads offline after first visit", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: /Don’t just/ })).toBeVisible();
  await page.getByRole("button", { name: "Lessons", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Build a little. Learn a lot." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "WinForms", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Make something useful." }),
  ).toBeVisible();
  await context.setOffline(false);
});

test("practical brief hands off requirements to the WinForms designer", async ({
  page,
}) => {
  await page.goto("/#assessment");
  await page.getByRole("button", { name: "Build this practical" }).click();
  await expect(page).toHaveURL(/#designer/);
  await expect(
    page.getByText("Active practical: Student Registration Form"),
  ).toBeVisible();
  await expect(page.getByText(/Exactly 8 digits/)).toBeVisible();
});

test("practical flows from brief to designer code and back to marker", async ({
  page,
}) => {
  await page.goto("/#assessment");
  await page.getByRole("button", { name: "Build this practical" }).click();
  await page.getByRole("button", { name: "TextBox", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Control Name" })
    .fill("txtStudentNumber");
  await page.getByRole("button", { name: "Button", exact: true }).click();
  await page.getByRole("textbox", { name: "Control Name" }).fill("btnRegister");
  await page
    .getByRole("textbox", { name: "Click handler" })
    .fill("btnRegister_Click");
  await page
    .getByRole("textbox", { name: "Practical C# code" })
    .fill(
      'private void btnRegister_Click(object sender, EventArgs e) { if (txtStudentNumber.Text.Length == 8) { MessageBox.Show("OK"); } else { MessageBox.Show("Bad"); } }',
    );
  await page
    .getByRole("button", { name: "Submit practical for marking" })
    .click();
  await expect(page).toHaveURL(/#assessment/);
  await expect(
    page.getByRole("textbox", { name: "Practical C# code" }),
  ).toHaveValue(/Length == 8/);
  await page.getByRole("button", { name: "Mark my practical" }).click();
  await expect(page.locator("#practical-marker")).toContainText("%");
  await expect(page.locator("#practical-marker")).toContainText("UI Design");
});

test("designer previews selection and checked-change event wiring", async ({
  page,
}) => {
  await page.goto("/#designer");
  await page.getByRole("button", { name: "ComboBox", exact: true }).click();
  await page.getByRole("textbox", { name: "Control Name" }).fill("cmbCourse");
  await page
    .getByRole("textbox", { name: "SelectedIndexChanged handler" })
    .fill("cmbCourse_SelectedIndexChanged");
  await page
    .getByText("Items (one per line)")
    .locator("textarea")
    .fill("BIT\nBCom");
  await page.getByRole("button", { name: "CheckBox", exact: true }).click();
  await page.getByRole("textbox", { name: "Control Name" }).fill("chkTerms");
  await page
    .getByRole("textbox", { name: "CheckedChanged handler" })
    .fill("chkTerms_CheckedChanged");
  await page.getByRole("button", { name: "Preview form" }).click();
  await page
    .getByRole("combobox", { name: "cmbCourse" })
    .selectOption({ label: "BCom" });
  await expect(page.locator(".form-validation")).toContainText(
    "cmbCourse_SelectedIndexChanged",
  );
  await page.getByRole("checkbox", { name: /CheckBox/ }).check();
  await expect(page.locator(".form-validation")).toContainText(
    "chkTerms_CheckedChanged",
  );
});

test("accessibility preferences and speech language persist", async ({
  page,
}) => {
  await page.goto("/#settings");
  await page
    .getByRole("combobox", { name: "Voice input language" })
    .selectOption("zu-ZA");
  await page.getByLabel("Reduce motion").check();
  await page.getByLabel("High contrast").check();
  await expect(page.locator(".app-shell")).toHaveClass(/reduce-motion/);
  await expect(page.locator(".app-shell")).toHaveClass(/high-contrast/);
  await page.reload();
  await expect(
    page.getByRole("combobox", { name: "Voice input language" }),
  ).toHaveValue("zu-ZA");
  await expect(page.getByLabel("Reduce motion")).toBeChecked();
  await expect(page.getByLabel("High contrast")).toBeChecked();
});

test("legacy saves retain progress and form controls after upgrade", async ({
  page,
}) => {
  const old = freshProgress();
  old.steps = { variables: ["0"] };
  delete old.settings.language;
  delete old.settings.reducedMotion;
  delete old.settings.highContrast;
  const { addControl } = await import("../src/designer-engine.mjs");
  const controls = addControl([], "TextBox");
  delete controls[0].eventSelectedIndexChanged;
  delete controls[0].eventCheckedChanged;
  await page.addInitScript(
    ({ old, controls }) => {
      if (!localStorage.getItem("cq-progress-v1")) {
        localStorage.setItem("cq-progress-v1", JSON.stringify(old));
        localStorage.setItem("cq-form", JSON.stringify(controls));
      }
    },
    { old, controls },
  );
  await page.goto("/#designer");
  await expect(page.locator(".placed-control")).toHaveCount(1);
  await expect(page.locator(".xp-pill")).toContainText("20 XP");
  await page.reload();
  await expect(page.locator(".placed-control")).toHaveCount(1);
});
test("practical and designer routes stay usable when storage is blocked", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = function () {
      throw new Error("Blocked");
    };
    Storage.prototype.setItem = function () {
      throw new Error("Blocked");
    };
  });
  for (const route of ["assessment", "designer", "settings"]) {
    await page.goto("/#" + route);
    await expect(page.locator(".page h1")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Let’s get you back on track." }),
    ).toHaveCount(0);
  }
});
test("voice command recovers after permission failure and uses the selected input language", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.__voiceMode = "deny";
    window.SpeechRecognition = class {
      start() {
        window.__recognitionLanguage = this.lang;
        this.onstart?.();
        setTimeout(() => {
          if (window.__voiceMode === "deny")
            this.onerror?.({ error: "not-allowed" });
          else
            this.onresult?.({ results: [[{ transcript: "vula izifundo" }]] });
          this.onend?.();
        }, 0);
      }
      abort() {
        this.onend?.();
      }
    };
  });
  await page.goto("/#settings");
  await page
    .getByRole("combobox", { name: "Voice input language" })
    .selectOption("zu-ZA");
  await page.getByLabel("Enable voice commands").check();
  await page.getByRole("button", { name: "World", exact: true }).click();
  await page
    .getByRole("button", { name: "Voice command", exact: true })
    .click();
  await expect(page.locator(".voice-status")).toContainText(
    "permission was denied",
  );
  await page.evaluate(() => (window.__voiceMode = "success"));
  await page
    .getByRole("button", { name: "Voice command", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Build a little. Learn a lot." }),
  ).toBeVisible();
  expect(await page.evaluate(() => window.__recognitionLanguage)).toBe("zu-ZA");
});

test("C# runtime works offline after its first controlled download", async ({
  page,
  context,
}) => {
  await plainEditor(page);
  await page.goto("/#playground");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await page
    .getByRole("textbox", { name: "C# code editor" })
    .fill('using System; Console.WriteLine("Warm compiler");');
  await page.getByRole("button", { name: "Run C#", exact: true }).click();
  await expect(page.locator(".run-feedback")).toContainText("Warm compiler", {
    timeout: 90000,
  });
  await context.setOffline(true);
  await page.reload();
  await page
    .getByRole("textbox", { name: "C# code editor" })
    .fill('using System; Console.WriteLine("Offline compiler");');
  await page.getByRole("button", { name: "Run C#", exact: true }).click();
  await expect(page.locator(".run-feedback")).toContainText(
    "Offline compiler",
    { timeout: 90000 },
  );
  await context.setOffline(false);
});

test("designer double-click creates a default WinForms event handler", async ({
  page,
}) => {
  await page.goto("/#designer");
  await page.getByRole("button", { name: "Button", exact: true }).click();
  await page.getByRole("textbox", { name: "Control Name" }).fill("btnLogin");
  await page.locator(".placed-control").last().dblclick();
  await expect(
    page.getByRole("textbox", { name: "Click handler" }),
  ).toHaveValue("btnLogin_Click");
  await expect(page.locator(".form-validation")).toContainText(
    "Opened btnLogin_Click",
  );
});

test("designer resize handle changes size and undo restores it", async ({
  page,
}) => {
  await page.goto("/#designer");
  await page.getByRole("button", { name: "Button", exact: true }).click();
  const control = page.locator(".placed-control").last();
  const before = await control.boundingBox();
  const handle = page.getByRole("button", { name: /Resize button1/ });
  const box = await handle.boundingBox();
  if (!before || !box) throw new Error("resize geometry unavailable");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 40,
    box.y + box.height / 2 + 25,
  );
  await page.mouse.up();
  const after = await control.boundingBox();
  expect(after.width).toBeGreaterThan(before.width);
  expect(after.height).toBeGreaterThan(before.height);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  const restored = await control.boundingBox();
  expect(Math.round(restored.width)).toBe(Math.round(before.width));
  expect(Math.round(restored.height)).toBe(Math.round(before.height));
});

test("designer event code persists and is included in exports without an assessment brief", async ({
  page,
}) => {
  await page.goto("/#designer");
  await page.getByRole("button", { name: "Button", exact: true }).click();
  await page.getByRole("textbox", { name: "Control Name" }).fill("btnHello");
  await page.locator(".placed-control").last().dblclick();
  await expect(
    page.getByRole("textbox", { name: "Form1.cs event code" }),
  ).toContainText("btnHello_Click");
  await page
    .getByRole("textbox", { name: "Form1.cs event code" })
    .fill(
      'private void btnHello_Click(object sender, EventArgs e) { MessageBox.Show("Saved handler"); }',
    );
  await page.reload();
  await page
    .locator(".workspace-tabs")
    .getByRole("button", { name: "Form1.cs", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Form1.cs event code" }),
  ).toContainText("Saved handler");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Windows project" }).click();
  const file = await downloadPromise;
  const { readFile } = await import("node:fs/promises");
  const { unzipSync, strFromU8 } = await import("fflate");
  const zip = unzipSync(await readFile(await file.path()));
  expect(strFromU8(zip["Form1.cs"])).toContain("Saved handler");
});

test.describe("workspace download recovery", () => {
  test.use({ serviceWorkers: "block" });
  test("a failed lazy module can be refreshed without losing learner progress", async ({
    page,
  }) => {
    let blocked = true;
    await page.route("**/assets/FormDesigner-*.js", (route) =>
      blocked ? route.abort("failed") : route.continue(),
    );
    await page.addInitScript(
      (state) => {
        if (!localStorage.getItem("cq-progress-v1"))
          localStorage.setItem("cq-progress-v1", JSON.stringify(state));
      },
      {
        ...freshProgress(),
        settings: { ...freshProgress().settings, name: "Recovery learner" },
      },
    );
    await page.goto("/");
    await page.getByRole("button", { name: "WinForms", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Let’s get you back on track." }),
    ).toBeVisible();
    blocked = false;
    await page.getByRole("button", { name: "Load latest workspace" }).click();
    await expect(
      page.getByRole("heading", { name: "Make something useful." }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("cq-progress-v1")).settings.name,
      ),
    ).toBe("Recovery learner");
  });
});
