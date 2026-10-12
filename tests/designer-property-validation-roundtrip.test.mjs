import test from "node:test";
import assert from "node:assert/strict";
import { addControl, validateForm, designerCode } from "../src/designer-engine.mjs";

test("JSON-restored WinForms boolean and enum properties reject malformed values", () => {
  const control = addControl([], "Label")[0];
  const cases = [
    ["enabled", "definitely"],
    ["enabled", null],
    ["visible", "perhaps"],
    ["visible", 1],
    ["dock", "Unicorn"],
    ["dock", null],
    ["anchor", "Top, Banana"],
    ["anchor", "Top, Top"],
    ["anchor", null],
    ["anchor", ""],
    ["anchor", "None, Left"],
  ];
  for (const [key, value] of cases) {
    const restored = JSON.parse(JSON.stringify([{ ...control, [key]: value }]));
    const result = validateForm(restored);
    assert.equal(result.ok, false, key + "=" + String(value));
    assert.ok(result.issues.some((issue) => issue.toLowerCase().includes(key.toLowerCase())), key);
  }
});

test("valid WinForms boolean, Dock and Anchor values survive restoration and export", () => {
  const control = addControl([], "Label")[0];
  for (const anchor of ["None", "Top, Left", "Left, Right"]) {
    for (const dock of ["None", "Fill", "Bottom"]) {
      const restored = JSON.parse(JSON.stringify([{
        ...control, enabled: false, visible: false, anchor, dock,
      }]));
      assert.equal(validateForm(restored).ok, true, anchor + "/" + dock);
      const code = designerCode(restored);
      assert.match(code, /\.Enabled = false;/);
      assert.match(code, /\.Visible = false;/);
      assert.match(code, /\.Dock = System\.Windows\.Forms\.DockStyle\./);
    }
  }
});
