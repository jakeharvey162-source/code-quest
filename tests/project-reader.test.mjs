import test from "node:test";
import assert from "node:assert/strict";
import { zipSync, strToU8 } from "fflate";
import { readProject } from "../src/lib/project-reader.mjs";
import { projectZip } from "../src/lib/project-export.mjs";
import { addControl } from "../src/designer-engine.mjs";
test("reads ZIP source files without binary/build artifacts", async () => {
  const files = await readProject("student.zip", zipSync({
    "Student/Program.cs": strToU8('Console.WriteLine("hello");'),
    "Student/bin/generated.cs": strToU8("skip"),
    "photo.png": new Uint8Array([1,2,3]),
    "brief.txt": strToU8("Create a Label"),
  }));
  assert.deepEqual(files.map(f => f.name), ["brief.txt", "Student/Program.cs"].sort((a,b) => a.localeCompare(b)));
  assert.match(files.find(f => f.name.endsWith("Program.cs")).text, /hello/);
});
test("exported form can be read back with controls and event code", async () => {
  const controls = addControl([], "Label");
  const files = await readProject("form.zip", projectZip(controls, { handlerCode: "// draft" }));
  assert.deepEqual(JSON.parse(files.find(f => f.name === "codequest-form.json").text), { version: 1, controls, handlerCode: "// draft" });
});
test("rejects unsafe paths, oversized text, huge entry counts and invalid ZIPs", async () => {
  await assert.rejects(readProject("bad.zip", zipSync({ "../escape.cs": strToU8("bad") })), /unsafe/);
  await assert.rejects(readProject("large.zip", zipSync({ "bomb.txt": new Uint8Array(2 * 1024 * 1024 + 1) })), /expands/);
  await assert.rejects(readProject("many.zip", zipSync(Object.fromEntries(Array.from({length:301}, (_,i) => [`${i}.txt`, strToU8("x")])))), /too many/);
  await assert.rejects(readProject("broken.zip", strToU8("no zip")), /valid/);
  await assert.rejects(readProject("empty.zip", zipSync({ "pic.png": new Uint8Array([1]) })), /No readable/);
});
test("accepts plain C# and rejects unsupported files", async () => {
  assert.equal((await readProject("Program.cs", strToU8("hello")))[0].text, "hello");
  await assert.rejects(readProject("file.exe", strToU8("hello")), /Choose/);
});
