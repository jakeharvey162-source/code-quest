import test from "node:test";
import assert from "node:assert/strict";
import { oopStages, nextStage, guidance } from "../src/lesson-engine.mjs";
test("lesson contains complete learning loop", () =>
  assert.deepEqual(
    oopStages.map((x) => x.id),
    ["see", "predict", "build", "breakfix", "apply"],
  ));
test("failed stage does not advance", () =>
  assert.equal(nextStage(2, false), 2));
test("passed stage advances", () => assert.equal(nextStage(2, true), 3));
test("final application uses minimal help", () =>
  assert.equal(guidance(4), "minimal"));
