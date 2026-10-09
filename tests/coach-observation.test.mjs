import test from "node:test";
import assert from "node:assert/strict";
import {
  observationReply,
  describeObservation,
} from "../src/lib/coach-observation.mjs";
const draft = {
  page: "designer",
  mode: "Designing Form1",
  controls: 1,
  selected: "lblName",
  caption: "Name",
  issues: [],
  output: "",
};
test("Tor reacts to observed changes, never invents a first observation", () => {
  assert.equal(observationReply(draft, null), null);
  assert.equal(observationReply(draft, draft), null);
  assert.match(
    observationReply({ ...draft, caption: "Student Name" }, draft).text,
    /Student Name.*lblName/,
  );
  assert.equal(
    observationReply(
      { ...draft, output: "CS0103: txtMissing does not exist" },
      draft,
    ).mood,
    "concerned",
  );
  assert.equal(
    observationReply({ ...draft, mode: "Running Form1" }, draft).mood,
    "happy",
  );
  assert.match(
    observationReply({ ...draft, output: "btnSave_Click executed." }, draft)
      .text,
    /empty input/,
  );
  assert.equal(observationReply({ ...draft, page: "playground" }, draft), null);
});
test("context readback identifies the real workspace and visible caption", () => {
  assert.match(describeObservation(draft), /lblName.*Name/);
  assert.equal(
    describeObservation({
      ...draft,
      page: "playground",
      mode: "Editing Program.cs",
      selected: "",
      caption: "",
    }),
    "Editing Program.cs",
  );
});
