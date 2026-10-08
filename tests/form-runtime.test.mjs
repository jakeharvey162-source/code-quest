import test from "node:test";
import assert from "node:assert/strict";
import { addControl } from "../src/designer-engine.mjs";
import { formEventSource, parseFormOutput } from "../src/lib/form-runtime.mjs";
test("form state round-trips Unicode, pipes, newlines, collections and booleans", () => {
  const controls = addControl([], "Label");
  const b64 = text => Buffer.from(text).toString("base64");
  const text = "Sawubona | é\nWorld";
  const output = `student console output\nCQCONTROL|label1|${b64(text)}|False|True|True|True|3|${b64("Ada\nHarvey")}|1\nCQMESSAGE|${b64("Enter a name")}`;
  const result = parseFormOutput(output, controls);
  assert.equal(result.controls[0].text, text);
  assert.equal(result.controls[0].items, "Ada\nHarvey");
  assert.equal(result.controls[0].enabled, false);
  assert.equal(result.controls[0].selectedIndex, 1);
  assert.deepEqual(result.messages, ["Enter a name"]);
  assert.throws(() => parseFormOutput("", controls), /complete form/);
});
test("event source escapes text, invokes selected sender and rejects invalid wiring", () => {
  const controls = addControl([], "Button"); controls[0].text='Say "hello"'; controls[0].eventClick="button1_Click";
  const source = formEventSource(controls, "void button1_Click(object sender, EventArgs e) {}", "button1_Click", "button1");
  assert.match(source, /Say ""hello""/);
  assert.match(source, /button1_Click\(button1, EventArgs.Empty\)/);
  assert.throws(() => formEventSource(controls, "", "evil();", "button1"), /valid event/);
  assert.throws(() => formEventSource(controls, "", "button1_Click", "missing"), /event control/);
});
