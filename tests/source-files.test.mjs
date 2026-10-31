import test from "node:test";
import assert from "node:assert/strict";
import {
  classFile,
  compileProject,
  validSourcePath,
  validSourceFiles,
  sourceTree,
  renameSourceFile,
  removeSourceFile,
} from "../src/lib/source-files.mjs";
import { projectZip } from "../src/lib/project-export.mjs";
import { readProject } from "../src/lib/project-reader.mjs";

test("nested source paths stay portable and reject traversal, reserved and ambiguous Windows names", () => {
  for (const path of [
    "Account.cs",
    "Models/Account.cs",
    "Domain/Bank_1/Account.cs",
  ])
    assert.equal(validSourcePath(path), true, path);
  for (const path of [
    "../Account.cs",
    "/Account.cs",
    "Models//Account.cs",
    "./Account.cs",
    "Models/../Account.cs",
    "Models\\Account.cs",
    "C:/Account.cs",
    "Models/Account.cs/",
    "Models /Account.cs",
    "Models./Account.cs",
    "Models/Account.cs ",
    "Models/Account.cs.",
    "Models/Acc\nount.cs",
    "Models/NUL.cs",
    "CON/Account.cs",
    "LPT1/Account.cs",
    "Models/Program.cs",
    "Models/form1.cs",
    "Models/Form1.Designer.cs",
    "Account.js",
    null,
    123,
  ])
    assert.equal(validSourcePath(path), false, String(path));
  assert.equal(validSourceFiles([{ path: 123, text: "" }]), false);
  assert.equal(
    validSourceFiles([
      { path: "Models/A.cs", text: "" },
      { path: "models/a.cs", text: "" },
    ]),
    false,
  );
  assert.equal(
    validSourceFiles(
      Array.from({ length: 21 }, (_, i) => ({ path: `A${i}.cs`, text: "" })),
    ),
    false,
  );
  assert.equal(
    validSourceFiles([{ path: "A.cs", text: "x".repeat(50001) }]),
    false,
  );
});

test("file management is immutable, path-only, and refuses collisions or generated files", () => {
  const source = Object.freeze([
    Object.freeze(classFile("Account", "class", "Models")),
    Object.freeze(classFile("Student")),
  ]);
  const renamed = renameSourceFile(
    source,
    "Models/Account.cs",
    "Domain/Customer.cs",
  );
  assert.equal(renamed[0].path, "Domain/Customer.cs");
  assert.equal(renamed[0].text, source[0].text);
  assert.match(renamed[0].text, /class Account/); // Renaming a file is not symbol refactoring.
  assert.equal(source[0].path, "Models/Account.cs");
  assert.equal(
    renameSourceFile(source, "Student.cs", "student.cs")[1].path,
    "student.cs",
  );
  assert.throws(
    () => renameSourceFile(source, "Student.cs", "models/account.cs"),
    /already exists/,
  );
  assert.throws(
    () => renameSourceFile(source, "Student.cs", "Program.cs"),
    /reserved/,
  );
  assert.throws(
    () => renameSourceFile(source, "Missing.cs", "Other.cs"),
    /existing/,
  );
  assert.deepEqual(removeSourceFile(source, "Student.cs"), [source[0]]);
  assert.equal(source.length, 2);
  assert.throws(() => removeSourceFile(source, "Program.cs"), /existing/);
  assert.throws(() => classFile("A", "class", "../Models"));
});

test("legacy root filenames remain readable without allowing new nonportable items", () => {
  const files = [
    { path: "Aux.cs", text: "public class Aux {}" },
    { path: "A".repeat(250) + ".cs", text: "// older imported filename" },
    classFile("Account"),
  ];
  assert.equal(validSourceFiles(files), true);
  assert.equal(sourceTree(files).length, 4);
  assert.match(compileProject("", files), /public class Aux/);
  assert.equal(validSourcePath("Aux.cs"), false);
  assert.throws(() => classFile("Aux"));
  assert.throws(() => renameSourceFile(files, "Account.cs", "CON.cs"));
  const next = renameSourceFile(files, "Aux.cs", "Auxiliary.cs");
  assert.equal(next[0].text, files[0].text);
  assert.equal(next[1], files[1]);
});

test("solution tree groups folders deterministically while preserving file identity", () => {
  const files = [
    classFile("Zebra"),
    classFile("Account", "class", "Models"),
    classFile("Account", "class", "Domain/Bank"),
  ];
  const expected = [
    {
      type: "folder",
      name: "Domain",
      path: "Domain",
      children: [
        {
          type: "folder",
          name: "Bank",
          path: "Domain/Bank",
          children: [
            {
              type: "file",
              name: "Account.cs",
              path: "Domain/Bank/Account.cs",
            },
          ],
        },
      ],
    },
    {
      type: "folder",
      name: "Models",
      path: "Models",
      children: [
        { type: "file", name: "Account.cs", path: "Models/Account.cs" },
      ],
    },
    { type: "file", name: "Program.cs", path: "Program.cs" },
    { type: "file", name: "Zebra.cs", path: "Zebra.cs" },
  ];
  assert.deepEqual(sourceTree(files), expected);
  assert.deepEqual(sourceTree([...files].reverse()), expected);
  assert.equal(sourceTree([], "Form1.cs")[0].path, "Form1.cs");
  const mixedCase = [
    { path: "Models/A.cs", text: "" },
    { path: "models/B.cs", text: "" },
  ];
  assert.equal(sourceTree(mixedCase)[0].children.length, 2);
  assert.deepEqual(sourceTree(mixedCase), sourceTree([...mixedCase].reverse()));
});

test("nested project files survive native ZIP export and keep namespaces during browser compilation", async () => {
  const files = [
    {
      path: "Domain/Bank/Account.cs",
      text: "using System;\nnamespace Bank;\npublic class Account { public int Balance = 5; }",
    },
  ];
  const imported = await readProject(
    "CodeQuestForms.zip",
    projectZip([], { sourceFiles: files }),
  );
  assert.deepEqual(
    imported.find((file) => file.name === files[0].path),
    { name: files[0].path, text: files[0].text },
  );
  const saved = JSON.parse(
    imported.find((file) => file.name === "codequest-form.json").text,
  );
  assert.deepEqual(saved.sourceFiles, files);
  const compiled = compileProject(
    "using System;\nConsole.WriteLine(new Bank.Account().Balance);",
    files,
  );
  assert.ok(
    compiled.indexOf("using System;") < compiled.indexOf("Console.WriteLine"),
  );
  assert.match(compiled, /namespace Bank\n\{/);
  assert.match(compiled, /class Account/);
});
