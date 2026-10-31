import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { zipSync, unzipSync, strToU8, strFromU8 } from "fflate";
import { freshProgress } from "../src/lib/progress.ts";
import { addControl } from "../src/designer-engine.mjs";

async function seed(page, files = [], extra = {}) {
  const progress = freshProgress();
  progress.settings.editorMode = "plain";
  progress.settings.reducedMotion = true;
  await page.addInitScript(
    ({ progress, files, extra }) => {
      if (sessionStorage.getItem("explorer-seeded")) return;
      localStorage.setItem("cq-progress-v1", JSON.stringify(progress));
      localStorage.setItem("cq-source-files", JSON.stringify(files));
      for (const [key, value] of Object.entries(extra))
        localStorage.setItem(key, value);
      sessionStorage.setItem("explorer-seeded", "true");
    },
    { progress, files, extra },
  );
}
const sourceFiles = (page) =>
  page.getByRole("region", { name: "C# solution files", exact: true });
const editor = (page) =>
  page.getByRole("textbox", { name: "C# code editor", exact: true });
async function uploadProject(page, bytes, name = "nested-project.zip") {
  const reader = page.locator(".project-reader");
  if ((await reader.getAttribute("open")) === null)
    await reader.locator("summary").click();
  await page.getByLabel("Choose project file").setInputFiles({
    name,
    mimeType: "application/zip",
    buffer: Buffer.from(bytes),
  });
}

test("nested C# items compile, move without changing symbols, and survive console ZIP round-trip", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/#playground");
  await page
    .getByRole("button", { name: "Add class / C# item", exact: true })
    .click();
  await page.getByLabel("Class name", { exact: true }).fill("Account");
  await page.getByLabel("Folder path", { exact: true }).fill("Models/Bank");
  await page
    .getByRole("button", { name: "Create C# file", exact: true })
    .click();
  await expect(page.getByLabel("Active C# file", { exact: true })).toHaveValue(
    "Models/Bank/Account.cs",
  );
  await expect(
    page.getByRole("treeitem", { name: "Account.cs", exact: true }),
  ).toBeFocused();
  const account = "public class Account { public int Balance = 250; }";
  await editor(page).fill(account);
  await page
    .getByRole("button", { name: "Rename / move file", exact: true })
    .click();
  await page
    .getByLabel("New file path", { exact: true })
    .fill("Domain/Customer.cs");
  await page
    .getByRole("button", { name: "Save file path", exact: true })
    .click();
  await expect(page.getByLabel("Active C# file", { exact: true })).toHaveValue(
    "Domain/Customer.cs",
  );
  await expect(
    page.getByRole("treeitem", { name: "Customer.cs", exact: true }),
  ).toBeFocused();
  await expect(editor(page)).toHaveValue(account);
  await page
    .getByLabel("Active C# file", { exact: true })
    .selectOption("Program.cs");
  await editor(page).fill(
    "using System;\nConsole.WriteLine(new Account().Balance);",
  );
  await page.getByRole("button", { name: "Run C#", exact: true }).click();
  await expect(page.locator(".run-feedback")).toHaveText("250\n", {
    timeout: 90000,
  });
  const pendingDownload = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export C# project ZIP", exact: true })
    .click();
  const bytes = await readFile(await (await pendingDownload).path());
  const zip = unzipSync(bytes);
  expect(strFromU8(zip["Domain/Customer.cs"])).toBe(account);
  expect(zip["Models/Bank/Account.cs"]).toBeUndefined();
  await uploadProject(page, bytes);
  await page
    .getByRole("button", { name: "Open all C# project files", exact: true })
    .click();
  await page.reload();
  await page
    .getByLabel("Active C# file", { exact: true })
    .selectOption("Domain/Customer.cs");
  await expect(editor(page)).toHaveValue(account);
  await page
    .getByLabel("Active C# file", { exact: true })
    .selectOption("Program.cs");
  await page.getByRole("button", { name: "Run C#", exact: true }).click();
  await expect(page.locator(".run-feedback")).toHaveText("250\n", {
    timeout: 90000,
  });
});

test("deleting an item requires confirmation, preserves main, and keeps selection coherent after reload", async ({
  page,
}) => {
  const account = {
    path: "Models/Account.cs",
    text: "public class Account {}",
  };
  await seed(page, [account]);
  await page.goto("/#playground");
  await expect(
    page.getByRole("button", { name: "Delete file", exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel("Active C# file", { exact: true })
    .selectOption(account.path);
  await page.getByRole("button", { name: "Delete file", exact: true }).click();
  await sourceFiles(page)
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await expect(editor(page)).toHaveValue(account.text);
  await expect(page.getByLabel("Active C# file", { exact: true })).toHaveValue(
    account.path,
  );
  await page.getByRole("button", { name: "Delete file", exact: true }).click();
  await page.getByRole("button", { name: "Remove file", exact: true }).click();
  await expect(
    page.getByRole("treeitem", { name: "Program.cs", exact: true }),
  ).toBeFocused();
  await expect(page.getByLabel("Active C# file", { exact: true })).toHaveValue(
    "Program.cs",
  );
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("cq-source-files")),
    ),
  ).toEqual([]);
  await page.reload();
  await expect(
    page.getByLabel("Active C# file", { exact: true }).locator("option"),
  ).toHaveCount(1);
});

test("wrapped console ZIP imports keep distinct folders with matching file basenames", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/#playground");
  await uploadProject(
    page,
    zipSync({
      "StudentProject/Program.cs": strToU8(
        "using System;\nConsole.WriteLine(new Bank.Account().Value + new School.Account().Value);",
      ),
      "StudentProject/Bank/Account.cs": strToU8(
        "namespace Bank;\npublic class Account { public int Value = 2; }",
      ),
      "StudentProject/School/Account.cs": strToU8(
        "namespace School;\npublic class Account { public int Value = 3; }",
      ),
    }),
  );
  await page
    .getByRole("button", { name: "Open all C# project files", exact: true })
    .click();
  await expect(
    page.getByLabel("Active C# file", { exact: true }).locator("option"),
  ).toHaveText(["Program.cs", "Bank/Account.cs", "School/Account.cs"]);
  await page.getByRole("button", { name: "Run C#", exact: true }).click();
  await expect(page.locator(".run-feedback")).toHaveText("5\n", {
    timeout: 90000,
  });
});

test("WinForms compiles nested classes and retains their native export and restoration", async ({
  page,
}) => {
  let controls = addControl([], "Label");
  controls = addControl(controls, "Button");
  controls[1].text = "Read balance";
  controls[1].eventClick = "balance_Click";
  const account = {
    path: "Models/Account.cs",
    text: "public class Account { public int Balance = 250; }",
  };
  await seed(page, [account], {
    "cq-form": JSON.stringify(controls),
    "cq-practical-code":
      "private void balance_Click(object sender, EventArgs e) { label1.Text = new Account().Balance.ToString(); }",
  });
  await page.goto("/#designer");
  await page.getByRole("button", { name: "Start / F5", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Running Form1 application", exact: true })
    .getByRole("button", { name: "Read balance", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", {
      name: "Running Form1 application",
      exact: true,
    }),
  ).toContainText("250", { timeout: 90000 });
  await page
    .getByRole("button", { name: "Stop debugging", exact: true })
    .click();
  const pendingDownload = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export Windows project", exact: true })
    .click();
  const bytes = await readFile(await (await pendingDownload).path());
  const zip = unzipSync(bytes);
  expect(strFromU8(zip[account.path])).toBe(account.text);
  expect(JSON.parse(strFromU8(zip["codequest-form.json"])).sourceFiles).toEqual(
    [account],
  );
  await uploadProject(page, bytes, "forms.zip");
  await page
    .getByLabel("Project file", { exact: true })
    .selectOption({ label: "codequest-form.json" });
  await page
    .getByRole("button", { name: "Restore form from project", exact: true })
    .click();
  await page
    .getByLabel("Active C# file", { exact: true })
    .selectOption(account.path);
  await expect(
    page.getByRole("textbox", { name: account.path + " code", exact: true }),
  ).toHaveValue(account.text);
  await page.reload();
  await page
    .getByLabel("Active C# file", { exact: true })
    .selectOption(account.path);
  await expect(
    page.getByRole("textbox", { name: account.path + " code", exact: true }),
  ).toHaveValue(account.text);
});

test("Solution Explorer supports keyboard traversal, collapse and explicit file activation", async ({
  page,
}) => {
  await seed(page, [
    { path: "Models/Account.cs", text: "public class Account {}" },
  ]);
  await page.goto("/#playground");
  const tree = page.getByRole("tree", {
    name: "Solution Explorer",
    exact: true,
  });
  const solution = tree.getByRole("treeitem").first();
  await solution.focus();
  await solution.press("Home");
  await expect(solution).toBeFocused();
  await solution.press("ArrowRight");
  await expect(solution).toHaveAttribute("aria-expanded", "true");
  await solution.press("ArrowDown");
  const project = tree.getByRole("treeitem").nth(1);
  await expect(project).toBeFocused();
  await project.press("ArrowRight");
  await expect(project).toHaveAttribute("aria-expanded", "true");
  const folder = tree.getByRole("treeitem", { name: "Models", exact: true });
  await folder.focus();
  await folder.press("ArrowRight");
  await folder.press("ArrowDown");
  const file = tree.getByRole("treeitem", { name: "Account.cs", exact: true });
  await expect(file).toBeFocused();
  await file.press("ArrowUp");
  await expect(folder).toBeFocused();
  await folder.press("ArrowDown");
  await file.press("Enter");
  await expect(page.getByLabel("Active C# file", { exact: true })).toHaveValue(
    "Models/Account.cs",
  );
  await expect(file).toHaveAttribute("aria-selected", "true");
  await file.press("ArrowLeft");
  await expect(folder).toBeFocused();
  await folder.press("ArrowLeft");
  await expect(folder).toHaveAttribute("aria-expanded", "false");
  await expect(file).toBeHidden();
  await folder.press("End");
  await expect(
    tree.getByRole("treeitem", { name: "Program.cs", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Home");
  await expect(solution).toBeFocused();
});

test("Solution Explorer is accessible and fits desktop and phone layouts", async ({
  page,
}) => {
  await seed(page, [
    { path: "Models/Account.cs", text: "public class Account {}" },
  ]);
  await page.goto("/#playground");
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    const result = await new AxeBuilder({ page })
      .include(".source-explorer")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(result.violations, JSON.stringify(result.violations)).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 2,
      ),
    ).toBe(false);
  }
});

test("failed source persistence keeps the original file and active selection", async ({
  page,
}) => {
  const account = {
    path: "Models/Account.cs",
    text: "public class Account {}",
  };
  await seed(page, [account]);
  await page.goto("/#playground");
  await page
    .getByLabel("Active C# file", { exact: true })
    .selectOption(account.path);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "cq-source-files")
        throw new DOMException("Storage unavailable", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await page
    .getByRole("button", { name: "Rename / move file", exact: true })
    .click();
  await page
    .getByLabel("New file path", { exact: true })
    .fill("Models/Customer.cs");
  await page
    .getByRole("button", { name: "Save file path", exact: true })
    .click();
  await expect(sourceFiles(page).getByRole("alert")).toContainText(
    /saved|storage/i,
  );
  await expect(page.getByLabel("Active C# file", { exact: true })).toHaveValue(
    account.path,
  );
  await expect(editor(page)).toHaveValue(account.text);
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("cq-source-files")),
    ),
  ).toEqual([account]);
});

test("legacy root filenames remain readable through edits, item creation and reload", async ({
  page,
}) => {
  const legacy = {
    path: "Aux.cs",
    text: "public class Aux { public int Value = 7; }",
  };
  const account = { path: "Account.cs", text: "public class Account {}" };
  await seed(page, [legacy, account]);
  await page.goto("/#playground");
  await expect(sourceFiles(page).getByRole("note")).toContainText(
    "Your code is preserved",
  );
  await page
    .getByLabel("Active C# file", { exact: true })
    .selectOption("Aux.cs");
  await expect(editor(page)).toHaveValue(legacy.text);
  await page
    .getByLabel("Active C# file", { exact: true })
    .selectOption("Account.cs");
  const updatedAccount = "public class Account { public int Balance = 25; }";
  await editor(page).fill(updatedAccount);
  await page
    .getByRole("button", { name: "Add class / C# item", exact: true })
    .click();
  await page.getByLabel("Class name", { exact: true }).fill("Student");
  await page.getByLabel("Folder path", { exact: true }).fill("Models");
  await page
    .getByRole("button", { name: "Create C# file", exact: true })
    .click();
  await expect(
    page.getByRole("treeitem", { name: "Student.cs", exact: true }),
  ).toBeFocused();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("cq-source-files")),
  );
  expect(saved).toHaveLength(3);
  expect(saved).toEqual(
    expect.arrayContaining([legacy, { ...account, text: updatedAccount }]),
  );
  await page.reload();
  await expect(
    page.getByLabel("Active C# file", { exact: true }).locator("option"),
  ).toHaveText(["Program.cs", "Aux.cs", "Account.cs", "Models/Student.cs"]);
  await page
    .getByLabel("Active C# file", { exact: true })
    .selectOption("Aux.cs");
  await expect(editor(page)).toHaveValue(legacy.text);
  await page
    .getByLabel("Active C# file", { exact: true })
    .selectOption("Account.cs");
  await expect(editor(page)).toHaveValue(updatedAccount);
  await expect(sourceFiles(page).getByRole("note")).toContainText(
    "not portable to Windows",
  );
  await page
    .getByRole("button", { name: "Add class / C# item", exact: true })
    .click();
  await page.getByLabel("Class name", { exact: true }).fill("Aux");
  await page
    .getByRole("button", { name: "Create C# file", exact: true })
    .click();
  await expect(sourceFiles(page).getByRole("alert")).toContainText(
    "relative folder",
  );
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("cq-source-files")),
    ),
  ).toEqual(saved);
});

test("unsafe and colliding renames preserve source content, paths and active selection", async ({
  page,
}) => {
  const account = { path: "Account.cs", text: "public class Account {}" };
  const student = {
    path: "Models/Student.cs",
    text: "public class Student {}",
  };
  await seed(page, [account, student]);
  await page.goto("/#playground");
  await page
    .getByLabel("Active C# file", { exact: true })
    .selectOption(account.path);
  await page
    .getByRole("button", { name: "Rename / move file", exact: true })
    .click();
  for (const invalidPath of [
    "../Account.cs",
    "Models/../Account.cs",
    "Aux.cs",
    "models/student.cs",
  ]) {
    await page.getByLabel("New file path", { exact: true }).fill(invalidPath);
    await page
      .getByRole("button", { name: "Save file path", exact: true })
      .click();
    await expect(sourceFiles(page).getByRole("alert")).toBeVisible();
    await expect(
      page.getByLabel("Active C# file", { exact: true }),
    ).toHaveValue(account.path);
    await expect(editor(page)).toHaveValue(account.text);
    expect(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("cq-source-files")),
      ),
    ).toEqual([account, student]);
  }
});
