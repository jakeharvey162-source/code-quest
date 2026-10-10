import test from "node:test";
import assert from "node:assert/strict";
import {
  addControl,
  updateControl,
  removeControl,
  moveControl,
  resizeControl,
  validateForm,
  designerCode,
} from "../src/designer-engine.mjs";
test("adds unique controls", () => {
  let a = addControl([], "Button");
  a = addControl(a, "Button");
  assert.equal(a[1].name, "button2");
});
test("updates VS-like properties", () => {
  let a = addControl([], "TextBox");
  a = updateControl(a, a[0].id, {
    name: "txtStudent",
    font: "Consolas, 10pt",
    enabled: false,
  });
  assert.equal(a[0].font, "Consolas, 10pt");
  assert.equal(a[0].enabled, false);
});
test("moves and resizes", () => {
  let a = addControl([], "Button");
  a = moveControl(a, a[0].id, 90, 120);
  a = resizeControl(a, a[0].id, 160, 44);
  assert.deepEqual(
    [a[0].x, a[0].y, a[0].width, a[0].height],
    [90, 120, 160, 44],
  );
});
test("removes controls", () =>
  assert.equal(removeControl(addControl([], "Label"), "label1").length, 0));
test("allows unwired Button and omits Click subscription", () => {
  const controls = addControl([], "Button");
  assert.equal(validateForm(controls).ok, true);
  const code = designerCode(controls);
  assert.match(code, /new System\.Windows\.Forms\.Button\(\)/);
  assert.doesNotMatch(code, /\.Click \+=/);
});
test("passes wired button", () => {
  let a = addControl([], "Button");
  a = updateControl(a, a[0].id, {
    name: "btnLogin",
    eventClick: "btnLogin_Click",
  });
  assert.equal(validateForm(a).ok, true);
});
test("generates event wiring", () => {
  let a = addControl([], "Button");
  a = updateControl(a, a[0].id, { eventClick: "button1_Click" });
  assert.match(designerCode(a), /Click \+= new System\.EventHandler/);
});

test("deleting then adding never reuses a live id", () => {
  let a = addControl(addControl([], "Button"), "Button");
  a = removeControl(a, "button1");
  a = addControl(a, "Button");
  assert.equal(new Set(a.map((c) => c.id)).size, 2);
});
test("numeric properties remain finite nonnegative integers", () => {
  let a = addControl([], "Button");
  a = updateControl(a, "button1", {
    x: -20,
    width: 0,
    tabIndex: 2.4,
    id: "other",
  });
  assert.equal(a[0].x, 0);
  assert.equal(a[0].width, 24);
  assert.equal(a[0].tabIndex, 2);
  assert.equal(a[0].id, "button1");
});
test("escapes text and exports editable appearance and events", () => {
  let a = updateControl(addControl([], "TextBox"), "textbox1", {
    text: 'Say "hi"\nC:\\temp',
    eventTextChanged: "Text_Changed",
    accessibleName: "Student name",
  });
  let code = designerCode(a);
  assert.ok(code.includes('Say \\"hi\\"\\nC:\\\\temp'));
  for (const field of [
    "Font =",
    "ForeColor =",
    "BackColor =",
    "Anchor =",
    "Dock =",
    "AccessibleName =",
    "TextChanged +=",
    "Controls.Add",
  ])
    assert.ok(code.includes(field), field);
});
test("rejects invalid handlers", () =>
  assert.equal(
    validateForm(
      updateControl(addControl([], "Button"), "button1", {
        eventClick: "not valid",
      }),
    ).ok,
    false,
  ));

test("rejects control names that collide with Form members", () => {
  for (const name of [
    "Text",
    "Name",
    "ClientSize",
    "Controls",
    "SuspendLayout",
  ]) {
    const a = updateControl(addControl([], "TextBox"), "textbox1", { name });
    assert.equal(validateForm(a).ok, false, name);
  }
});

test("generates selection and checked-change events", () => {
  let a = updateControl(addControl([], "ComboBox"), "combobox1", {
    eventSelectedIndexChanged: "cmbCourse_SelectedIndexChanged",
  });
  a = updateControl(addControl(a, "CheckBox"), "checkbox1", {
    eventCheckedChanged: "chkTerms_CheckedChanged",
  });
  const code = designerCode(a);
  assert.match(code, /SelectedIndexChanged \+=/);
  assert.match(code, /CheckedChanged \+=/);
});

test("export rejects event properties incompatible with the selected control type", () => {
  for (const patch of [
    { eventSelectedIndexChanged: "Changed" },
    { eventCheckedChanged: "Changed" },
  ])
    assert.equal(
      validateForm(updateControl(addControl([], "TextBox"), "textbox1", patch))
        .ok,
      false,
    );
});

test("rejects unsupported Anchor and Dock enum values before native export", () => {
  const base = addControl([], "Label");
  for (const patch of [
    { anchor: "Top, Banana" },
    { anchor: "Top, Top" },
    { anchor: "None, Left" },
    { dock: "Unicorn" },
  ]) {
    const form = updateControl(base, base[0].id, patch);
    assert.equal(validateForm(form).ok, false, JSON.stringify(patch));
  }
  const valid = updateControl(base, base[0].id, {
    anchor: "Top, Bottom, Left, Right",
    dock: "Fill",
  });
  assert.equal(validateForm(valid).ok, true);
});

test("validates unwired Button alongside Anchor and Dock rules", () => {
  const base = addControl([], "Button");
  assert.equal(validateForm(base).ok, true);
  assert.equal(validateForm(updateControl(base, base[0].id, { anchor: "Left, Banana" })).ok, false);
  assert.equal(validateForm(updateControl(base, base[0].id, { dock: "Unicorn" })).ok, false);
  const valid = updateControl(base, base[0].id, { anchor: "Left, Right", dock: "Fill" });
  assert.equal(validateForm(valid).ok, true);
  assert.doesNotMatch(designerCode(valid), /\.Click \+=/);
});

test("rejects nonboolean Enabled/Visible before native C# export", () => {
  const base = addControl([], "Button");
  for (const patch of [
    { enabled: "sometimes" },
    { visible: "maybe" },
    { enabled: 1 },
    { visible: null },
  ]) {
    const result = validateForm(updateControl(base, base[0].id, patch));
    assert.equal(result.ok, false, JSON.stringify(patch));
    assert.ok(result.issues.some((issue) => issue.includes(Object.keys(patch)[0])));
  }
  const valid = updateControl(base, base[0].id, { enabled: false, visible: false });
  assert.equal(validateForm(valid).ok, true);
  const code = designerCode(valid);
  assert.match(code, /\.Enabled = false;/);
  assert.match(code, /\.Visible = false;/);
});
