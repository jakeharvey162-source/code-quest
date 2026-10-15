import test from "node:test";
import assert from "node:assert/strict";
import { addControl, validateForm } from "../src/designer-engine.mjs";

test("JSON-restored WinForms controls reject invalid geometry before export", () => {
  const original = addControl([], "Label")[0];
  const restore = (patch) => JSON.parse(JSON.stringify([{ ...original, ...patch }]));

  for (const [key, value] of [
    ["x", Infinity],
    ["y", undefined],
    ["width", 0],
    ["height", -1],
    ["tabIndex", 2147483648],
    ["height", 1.5],
  ]) {
    const restored = restore({ [key]: value });
    const result = validateForm(restored);
    assert.equal(result.ok, false, key);
    assert.ok(result.issues.some((issue) => issue.includes(key)), key);
  }
});

test("JSON-restored valid 32-bit geometry remains exportable", () => {
  const original = addControl([], "Label")[0];
  const restored = JSON.parse(JSON.stringify([{
    ...original,
    x: 2147483647,
    y: 0,
    width: 1,
    height: 1,
    tabIndex: 2147483647,
  }]));
  assert.equal(validateForm(restored).ok, true);
});
