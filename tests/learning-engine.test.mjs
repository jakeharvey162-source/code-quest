import test from "node:test";
import assert from "node:assert/strict";
import { evaluate, detectSkills, hintLevel } from "../src/learning-engine.mjs";
test("passes correct OOP structure", () =>
  assert.equal(
    evaluate(
      'class Student { public virtual string GetRole()=>"";} class BITStudent : Student { public override string GetRole()=>"";}',
    ).ok,
    true,
  ));
test("finds missing inheritance", () =>
  assert.equal(
    evaluate("class Student {} class BITStudent {}").kind,
    "missing-inheritance",
  ));
test("finds orphan override", () =>
  assert.equal(
    evaluate(
      'class BITStudent : Student { public override string GetRole()=>"";}',
    ).kind,
    "orphan-override",
  ));
test("detects assessment OOP skills", () =>
  assert.deepEqual(
    detectSkills("Create an abstract class, derive a child and override it"),
    ["Abstraction", "Inheritance", "Polymorphism"],
  ));
test("fades hints", () => {
  assert.equal(hintLevel(1), "nudge");
  assert.equal(hintLevel(4), "worked-example");
});
