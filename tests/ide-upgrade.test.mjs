import test from "node:test";
import assert from "node:assert/strict";
import {
  classFile,
  compileProject,
  validSourceFiles,
} from "../src/lib/source-files.mjs";
import { snippetAt, plainSnippet } from "../src/lib/editor-snippets.mjs";
import { freshProgress, xpFor, migrateProgress } from "../src/lib/progress.ts";
import { projectFiles } from "../src/lib/project-export.mjs";
import {
  addControl,
  designerCode,
  validateForm,
  updateControl,
} from "../src/designer-engine.mjs";
test("source files retain namespaces, combine imports and reject unsafe or duplicate paths", () => {
  const account = classFile("Account");
  assert.ok(validSourceFiles([account]));
  assert.ok(!validSourceFiles([account, account]));
  assert.ok(!validSourceFiles([{ path: "../Account.cs", text: "" }]));
  const code = compileProject(
    "using System;\nConsole.WriteLine(new Account().Balance);",
    [
      {
        path: "Account.cs",
        text: "using System.Linq;\npublic class Account { public decimal Balance=500m; }",
      },
    ],
  );
  assert.ok(
    code.indexOf("using System.Linq;") < code.indexOf("Console.WriteLine"),
  );
  assert.match(
    compileProject("", [
      { path: "Account.cs", text: "namespace Bank;\npublic class Account {}" },
    ]),
    /namespace Bank\n\{/,
  );
  assert.throws(() => classFile("return"));
  const files = projectFiles([], { sourceFiles: [account] });
  assert.equal(files["Account.cs"], account.text);
  assert.deepEqual(JSON.parse(files["codequest-form.json"]).sourceFiles, [
    account,
  ]);
});
test("snippets preserve indentation, avoid member names and use the owning constructor name", () => {
  const snippet = snippetAt("    else", 8);
  assert.equal(plainSnippet(snippet).text, "else\n    {\n        \n    }");
  assert.equal(snippetAt("account.class", 13), null);
  const source = "class Account\n{\n    ctor";
  assert.match(
    plainSnippet(snippetAt(source, source.length)).text,
    /public Account\(\)/,
  );
});
test("quest XP is deduplicated and migrated profiles default to a light theme", () => {
  const p = freshProgress();
  p.steps["workshop-quests"] = [
    "class-builder",
    "class-builder",
    "oop-run",
    "unknown",
  ];
  assert.equal(xpFor(p), 100);
  delete p.settings.theme;
  assert.equal(migrateProgress(p).settings.theme, "light");
});
test("new controls export native types and reject invalid date and slider values", () => {
  let controls = [];
  for (const type of [
    "LinkLabel",
    "Panel",
    "GroupBox",
    "TrackBar",
    "DateTimePicker",
  ])
    controls = addControl(controls, type);
  assert.ok(validateForm(controls).ok);
  const code = designerCode(controls);
  assert.match(code, /new System.Windows.Forms.TrackBar/);
  assert.match(code, /DateTimePickerFormat.Short/);
  controls.find((c) => c.type === "TrackBar").value = 2.5;
  assert.ok(!validateForm(controls).ok);
});
test("containers move their children, prevent cycles and export real parent relationships", () => {
  let list = addControl([], "GroupBox");
  list = addControl(list, "Label");
  Object.assign(list[1], { parentId: list[0].id, x: 60, y: 70 });
  const moved = updateControl(list, list[0].id, { x: 46, y: 46 });
  assert.equal(moved[1].x, 76);
  assert.equal(moved[1].y, 86);
  assert.match(designerCode(moved), /groupbox1.Controls.Add\(this.label1\)/);
  moved[0].parentId = moved[0].id;
  assert.ok(!validateForm(moved).ok);
});

test("native events are wired after initialization to avoid firing handlers against unfinished controls", () => {
  let controls = addControl([], "TrackBar");
  controls = addControl(controls, "Label");
  controls[0].eventValueChanged = "slider_Changed";
  const code = designerCode(controls);
  assert.ok(
    code.indexOf("ValueChanged +=") > code.indexOf("this.label1 = new"),
  );
});
