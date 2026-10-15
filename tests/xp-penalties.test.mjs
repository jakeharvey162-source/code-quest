import test from "node:test";
import assert from "node:assert/strict";
import { freshProgress, xpFor, migrateProgress } from "../src/lib/progress.ts";
import { applyChallengePenalty, xpLost, XP_PENALTY } from "../src/lib/xp-penalties.mjs";

test("failed challenge solutions lose bounded XP; repeating the same code is free", () => {
  const start = freshProgress();
  start.steps.variables = ["0", "1"]; // 40 already-earned lesson XP
  assert.equal(xpFor(start), 40);
  let result = applyChallengePenalty(start, "bill", "return 0m;", xpFor(start));
  assert.equal(result.lost, XP_PENALTY);
  const once = result.progress;
  assert.equal(xpFor(once), 35);
  assert.equal(applyChallengePenalty(once, "bill", "return 0m;", xpFor(once)).lost, 0);
  result = applyChallengePenalty(once, "bill", "return 1m;", xpFor(once));
  assert.equal(result.lost, XP_PENALTY);
  const twice = result.progress;
  assert.equal(xpFor(twice), 30);
  assert.equal(applyChallengePenalty(twice, "bill", "return 2m;", xpFor(twice)).lost, 0);
  assert.equal(xpLost(twice.steps), 10);
  assert.deepEqual(migrateProgress(twice).steps["xp-penalties"], twice.steps["xp-penalties"]);
  assert.equal(xpFor(twice), 30);
  // A completed challenge never loses more XP from replaying tests.
  const solved = {...twice,steps:{...twice.steps,"code-challenges":["bill"]}};
  assert.equal(applyChallengePenalty(solved, "bill", "wrong again", xpFor(solved)).lost, 0);
});
test("new players, remix exercises and compiler exploration never create XP debt", () => {
  const start = freshProgress();
  assert.equal(applyChallengePenalty(start, "bill", "wrong", xpFor(start)).lost, 0);
  start.steps.variables=["0"]; // 20 XP
  assert.equal(applyChallengePenalty(start, "practice-remix", "wrong", xpFor(start)).lost, 0);
  const old = applyChallengePenalty(start, "bill", "wrong", xpFor(start)).progress;
  assert.equal(xpFor(old), 15);
  assert.equal(xpFor({...old,steps:{...old.steps,variables:[]}}), 0);
});
