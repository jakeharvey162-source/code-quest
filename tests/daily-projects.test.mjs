import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generatedProject,
  readProjectSpec,
  openGeneratedProject,
  restoreGeneratedProject,
} from "../src/lib/daily-projects.mjs";
test("daily projects are deterministic, change by day/round and reject invalid identifiers", () => {
  const a = generatedProject("2026-10-15", 0);
  assert.deepEqual(a, generatedProject("2026-10-15", 0));
  assert.notEqual(a.solution, generatedProject("2026-10-16", 0).solution);
  assert.notEqual(a.starter, generatedProject("2026-10-15", 1).starter);
  for (let n = 0; n < 50; n++) {
    const p = generatedProject("2026-10-15", n);
    assert.equal(p.cases.length, 16);
    assert.notEqual(p.starter, p.solution);
    assert.ok(!p.starter.includes("undefined"));
  }
  assert.equal(readProjectSpec('{"day":"2026-02-30","round":0}'), null);
  assert.throws(() => generatedProject("2026-10-15", -1));
});
test("changing generated projects preserves one previous draft, supports undo and keeps original missions", () => {
  const spec = { day: "2026-10-15", round: 0 };
  let drafts = openGeneratedProject(
    { "repair-code-equipment-booking": "original" },
    spec,
  );
  drafts["repair-code-generated-project"] = "my edited code";
  drafts["repair-input-generated-project"] = "my input";
  assert.equal(
    openGeneratedProject(drafts, spec)["repair-code-generated-project"],
    "my edited code",
  );
  const next = openGeneratedProject(drafts, { ...spec, round: 1 });
  assert.equal(next["repair-code-generated-project"], undefined);
  assert.equal(
    openGeneratedProject(next, spec)["repair-code-generated-project"],
    "my edited code",
  );
  const restored = restoreGeneratedProject(next);
  assert.equal(restored["repair-code-generated-project"], "my edited code");
  assert.equal(restored["repair-input-generated-project"], "my input");
  assert.equal(restored["repair-code-equipment-booking"], "original");
});
