import test from "node:test";
import assert from "node:assert/strict";
import {
  adventureKey,
  adventureDraftKey,
  lagosMissions,
  completedMissions,
  unlockedMission,
  adventureXp,
  awardMission,
} from "../src/lib/lagos-adventure.mjs";
import {
  challengeProgram,
  challengeResults,
} from "../src/lib/code-challenges.mjs";
import {
  freshProgress,
  migrateProgress,
  validateProgress,
  saveProgress,
  loadProgress,
} from "../src/lib/progress.ts";
import { setDataOwner } from "../src/lib/local-data.ts";

const day = "2026-10-29";
const passing = (mission) =>
  mission.cases.map(() => ({ passed: true, actual: "compiled output" }));

test("Lagos progression requires each mission's full successful compiler result and unlocks in order", () => {
  const initial = freshProgress();
  assert.equal(unlockedMission(initial.steps, "streetlights"), true);
  assert.equal(unlockedMission(initial.steps, "digital-shop"), false);
  assert.equal(unlockedMission(initial.steps, "network"), false);
  assert.equal(unlockedMission(initial.steps, "invented"), false);
  assert.strictEqual(
    awardMission(initial, "network", passing(lagosMissions[2]), day),
    initial,
  );
  assert.strictEqual(awardMission(initial, "streetlights", [], day), initial);
  assert.strictEqual(
    awardMission(
      initial,
      "streetlights",
      new Array(lagosMissions[0].cases.length),
      day,
    ),
    initial,
  );
  assert.strictEqual(
    awardMission(
      initial,
      "streetlights",
      passing(lagosMissions[0]).map(() => ({ passed: "true" })),
      day,
    ),
    initial,
  );
  assert.strictEqual(
    awardMission(
      initial,
      "streetlights",
      passing(lagosMissions[0]),
      "bad date",
    ),
    initial,
  );
  assert.strictEqual(
    awardMission(
      initial,
      "streetlights",
      passing(lagosMissions[0]).slice(1),
      day,
    ),
    initial,
  );
  const failed = passing(lagosMissions[0]);
  failed[2].passed = false;
  assert.strictEqual(
    awardMission(initial, "streetlights", failed, day),
    initial,
  );
  let progress = initial;
  for (const mission of lagosMissions) {
    assert.equal(unlockedMission(progress.steps, mission.id), true);
    const next = awardMission(progress, mission.id, passing(mission), day);
    assert.notStrictEqual(next, progress);
    assert.strictEqual(
      awardMission(next, mission.id, passing(mission), day),
      next,
    );
    progress = next;
  }
  assert.deepEqual(
    completedMissions(progress.steps).map((mission) => mission.id),
    lagosMissions.map((mission) => mission.id),
  );
  assert.equal(adventureXp(progress.steps), 200);
  assert.deepEqual(progress.activity, [day]);
  assert.deepEqual(initial.steps, {});
});

test("unknown, duplicate and out-of-order saved mission IDs never inflate chapter rewards", () => {
  assert.equal(
    adventureXp({ [adventureKey]: ["network", "digital-shop", "fake"] }),
    0,
  );
  assert.equal(
    adventureXp({
      [adventureKey]: ["streetlights", "streetlights", "network", "fake"],
    }),
    40,
  );
  assert.equal(adventureXp({ [adventureKey]: null }), 0);
});

test("mission validation rejects missing, failed and wrong-run output instead of granting rewards", () => {
  for (const mission of lagosMissions) {
    for (const output of ["", "old-run|0|PASS|MQ==", "run|0|FAIL|MQ=="]) {
      const rows = challengeResults(mission, output, "run");
      assert.equal(rows.length, mission.cases.length);
      assert.equal(
        rows.every((row) => row.passed),
        false,
      );
    }
    const program = challengeProgram(mission, mission.solution, "run");
    assert.match(program, /public static class Solution/);
    assert.equal(
      (program.match(/bool passed=actual==/g) || []).length,
      mission.cases.length,
    );
    assert.notEqual(mission.starter, mission.solution);
  }
});

test("adventure drafts and rewards survive existing migration, save/load and account isolation without altering lesson data", () => {
  const store = new Map();
  const previousStorage = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
  };
  try {
    const legacy = freshProgress();
    legacy.completed = ["variables"];
    legacy.steps.variables = ["0", "4"];
    legacy.drafts[adventureDraftKey("streetlights")] =
      lagosMissions[0].solution;
    const progress = awardMission(
      legacy,
      "streetlights",
      passing(lagosMissions[0]),
      day,
    );
    assert.deepEqual(progress.completed, legacy.completed);
    assert.deepEqual(progress.steps.variables, legacy.steps.variables);
    assert.equal(validateProgress(progress), true);
    assert.deepEqual(
      migrateProgress(JSON.parse(JSON.stringify(progress))),
      progress,
    );
    setDataOwner("student-a");
    assert.equal(saveProgress(progress), true);
    assert.deepEqual(loadProgress(), progress);
    setDataOwner("student-b");
    assert.equal(adventureXp(loadProgress().steps), 0);
    assert.deepEqual(loadProgress().drafts, {});
    setDataOwner("student-a");
    assert.equal(
      loadProgress().drafts[adventureDraftKey("streetlights")],
      lagosMissions[0].solution,
    );
    assert.deepEqual(migrateProgress(legacy), legacy);
  } finally {
    setDataOwner(null);
    if (previousStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousStorage;
  }
});
