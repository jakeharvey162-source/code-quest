import test from "node:test";
import assert from "node:assert/strict";
import {
  freshProgress,
  validateProgress,
  completeStep,
  xpFor,
  streakFor,
} from "../src/lib/progress.ts";
import { commandFor, voiceError } from "../src/lib/voice.ts";
import { projectFiles, projectZip } from "../src/lib/project-export.mjs";
import {
  addControl,
  updateControl,
  validateForm,
} from "../src/designer-engine.mjs";
import { unzipSync, strFromU8 } from "fflate";
import { lessons } from "../src/curriculum.ts";
test("curriculum contains unique lessons and complete coding challenges", () => {
  assert.equal(lessons.length, 21);
  assert.equal(new Set(lessons.map((l) => l.id)).size, 21);
  for (const lesson of lessons) {
    if (lesson.kind === "code") {
      assert.ok(lesson.prediction);
      for (const c of [lesson.build, lesson.apply]) {
        assert.ok(c.harness && c.expected && c.solution && c.starter);
        assert.notEqual(c.solution, c.starter);
      }
    } else assert.equal(lesson.questions.length, 4);
  }
});
test("XP is earned once and progress can be validated and restored", () => {
  let p = freshProgress();
  p = completeStep(p, "variables", "0");
  p = completeStep(p, "variables", "0");
  assert.equal(xpFor(p), 20);
  p = completeStep(p, "variables", "4", true);
  p = completeStep(p, "variables", "4", true);
  assert.equal(xpFor(p), 100);
  assert.ok(validateProgress(JSON.parse(JSON.stringify(p))));
  assert.equal(
    validateProgress({ ...p, settings: { ...p.settings, rate: 90 } }),
    false,
  );
  assert.equal(
    validateProgress({ ...p, drafts: { bad: { html: "<script>" } } }),
    false,
  );
});
test("streak counts real consecutive local days", () =>
  assert.equal(
    streakFor(["2026-10-05", "2026-10-06"], new Date(2026, 9, 7)),
    2,
  ));
test("voice commands are constrained to navigation and stop", () => {
  assert.equal(commandFor("open designer"), "designer");
  assert.equal(commandFor("Open code lab!"), "playground");
  assert.equal(commandFor("delete all files"), null);
  assert.match(voiceError("not-allowed"), /permission was denied/);
  assert.match(voiceError("network"), /connect/);
});
test("native ZIP includes editable project, solution, event handlers and escaped strings", () => {
  const controls = updateControl(addControl([], "Button"), "button1", {
    name: "btnSave",
    eventClick: "btnSave_Click",
    text: 'Say "hello"',
  });
  const files = projectFiles(controls);
  assert.ok(files["CodeQuestForms.sln"]);
  assert.match(files["Form1.cs"], /void btnSave_Click/);
  assert.match(files["Form1.Designer.cs"], /Controls.Add/);
  const zip = unzipSync(projectZip(controls));
  assert.match(strFromU8(zip["CodeQuestForms.csproj"]), /net8.0-windows/);
});
test("reserved C# names and invalid numeric ranges prevent export", () => {
  assert.equal(
    validateForm(
      updateControl(addControl([], "Label"), "label1", { name: "class" }),
    ).ok,
    false,
  );
  assert.equal(
    validateForm(
      updateControl(addControl([], "NumericUpDown"), "numericupdown1", {
        minimum: 10,
        maximum: 1,
      }),
    ).ok,
    false,
  );
});

test("export rejects handler collisions with fields and generated members", () => {
  const controls = addControl([], "Button");
  assert.equal(
    validateForm([{ ...controls[0], eventClick: controls[0].name }]).ok,
    false,
  );
  assert.equal(
    validateForm([{ ...controls[0], name: "Form1", eventClick: "Save_Click" }])
      .ok,
    false,
  );
});

import {
  markPractical,
  torPracticalFeedback,
} from "../src/lib/assessment-engine.mjs";
test("practical marker rewards complete work and identifies weak attempts", () => {
  const controls = [
    {
      type: "TextBox",
      name: "txtStudentNumber",
      eventTextChanged: "txtStudentNumber_TextChanged",
    },
    { type: "Button", name: "btnRegister", eventClick: "btnRegister_Click" },
  ];
  const strong = markPractical({
    controls,
    code: 'private void btnRegister_Click(){ if (txtStudentNumber.Text.Length == 8) { MessageBox.Show("OK"); } else { MessageBox.Show("Bad"); } }',
    requirements: { controls: ["TextBox", "Button"] },
  });
  const weak = markPractical({
    controls: [],
    code: "x = 1;",
    requirements: { controls: ["TextBox", "Button"] },
  });
  assert.ok(strong.total >= 70);
  assert.ok(weak.total < strong.total);
  assert.ok(weak.weak.includes("UI Design"));
});

test("Tor remediation targets the weakest practical category and escalates after repeated attempts", () => {
  const result = markPractical({
    controls: [],
    code: "x = 1;",
    requirements: { controls: ["TextBox", "Button"] },
  });
  const first = torPracticalFeedback(result, 1),
    third = torPracticalFeedback(result, 3, "Spicy");
  assert.equal(first.rematch, "controls");
  assert.equal(first.tone, "coach");
  assert.equal(third.tone, "spicy");
  assert.match(third.message, /Omo/);
});

import { migrateProgress } from "../src/lib/progress.ts";
import { voiceCommands } from "../src/lib/voice.ts";
test("legacy progress receives new accessibility defaults without losing work", () => {
  const old = completeStep(freshProgress(), "variables", "0");
  delete old.settings.language;
  delete old.settings.reducedMotion;
  delete old.settings.highContrast;
  const migrated = migrateProgress(old);
  assert.equal(xpFor(migrated), 20);
  assert.equal(migrated.settings.language, "en-ZA");
  assert.equal(
    migrateProgress({ ...old, settings: { ...old.settings, rate: 99 } }),
    null,
  );
});
test("commented or quoted code does not receive practical logic credit", () => {
  for (const code of [
    '// private void btnSave(){ if (txtNumber.Text.Length == 8) { MessageBox.Show("OK"); } else {} }',
    'string fake = "if (x) { MessageBox.Show(1); } else {}";',
  ]) {
    const r = markPractical({ code });
    assert.equal(r.breakdown["C# Logic"], 0);
    assert.equal(r.breakdown["Input Validation"], 0);
  }
});
test("exact length alone is not complete digit validation and feedback respects teacher preference", () => {
  const r = markPractical({ code: "if(txtStudentNumber.Text.Length == 8) {}" });
  assert.equal(r.breakdown["Input Validation"], 5);
  assert.ok(r.weak.includes("Input Validation"));
  assert.equal(torPracticalFeedback(r, 4, "Teacher").tone, "coach");
});
test("every displayed localized voice command resolves to its intended route", () => {
  for (const commands of Object.values(voiceCommands))
    for (const [route, phrase] of Object.entries(commands))
      assert.equal(commandFor(phrase), route, phrase);
});
test("native export declares new event methods and keeps the practical handler body", () => {
  let controls = addControl(addControl([], "ComboBox"), "CheckBox");
  controls = controls.map((c) => ({
    ...c,
    eventSelectedIndexChanged: c.type === "ComboBox" ? "CourseChanged" : "",
    eventCheckedChanged: c.type === "CheckBox" ? "TermsChanged" : "",
  }));
  const files = projectFiles(controls, {
    handlerCode:
      'private void CourseChanged(object sender, EventArgs e) { MessageBox.Show("Selected"); }',
  });
  assert.match(files["Form1.cs"], /void TermsChanged/);
  assert.match(files["Form1.cs"], /MessageBox.Show\("Selected"\)/);
  assert.equal(
    (files["Form1.cs"].match(/void CourseChanged/g) || []).length,
    1,
  );
});

test("Tor remediation escalates from concept to worked pattern without dumping a full answer",()=>{const result=markPractical({controls:[],code:"x = 1;",requirements:{controls:["TextBox","Button"]}});const a=torPracticalFeedback(result,1,"Friendly"),b=torPracticalFeedback(result,2,"Friendly"),c=torPracticalFeedback(result,3,"Spicy"),d=torPracticalFeedback(result,4,"Teacher");assert.equal(a.level,1);assert.equal(b.level,2);assert.match(c.message,/Omo/);assert.equal(d.level,4);assert.ok(d.message.length>20);assert.equal(a.rematch,"controls");});
