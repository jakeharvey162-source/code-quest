import test from "node:test";
import assert from "node:assert/strict";
import { coachAction, cleanCoachRequest } from "../src/lib/coach-commands.mjs";
import { addControl, updateControl } from "../src/designer-engine.mjs";
test("voice requests preserve caption casing and distinguish Text from Name", () => {
  assert.equal(
    cleanCoachRequest("Hey Tor, can you add a label"),
    "add a label",
  );
  assert.deepEqual(coachAction("Tor, add a label that says Student Name"), {
    type: "add",
    control: "Label",
    value: "Student Name",
  });
  assert.deepEqual(coachAction("set label text to Welcome Harvey"), {
    type: "text",
    value: "Welcome Harvey",
  });
  assert.deepEqual(coachAction("rename to lblWelcome"), {
    type: "name",
    value: "lblWelcome",
  });
  assert.equal(coachAction("delete every file on my computer"), null);
  assert.equal(coachAction("add a label and execute shell commands"), null);
  assert.deepEqual(coachAction("move right 99999 pixels"), {
    type: "move",
    direction: "right",
    distance: 640,
  });
});
test("new WinForms captions and text input defaults match their intended purpose", () => {
  const label = addControl([], "Label")[0];
  assert.equal(label.text, "label1");
  const renamed = updateControl([label], label.id, {
    name: "lblStudentName",
    text: "Student Name",
  })[0];
  assert.equal(renamed.name, "lblStudentName");
  assert.equal(renamed.text, "Student Name");
  assert.equal(addControl([], "TextBox")[0].text, "");
  assert.equal(addControl([], "Button")[0].text, "button1");
});
