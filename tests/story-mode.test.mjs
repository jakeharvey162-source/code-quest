import test from "node:test";
import assert from "node:assert/strict";
import { rookieMissions, rookieStoryState } from "../src/lib/story-missions.mjs";

test("Rookie Street is a fixed set of authored C# missions", () => {
  assert.deepEqual(rookieMissions.map((m) => m.lessonId), ["variables", "strings", "conditions"]);
  assert.equal(new Set(rookieMissions.map((m) => m.id)).size, rookieMissions.length);
  assert.ok(rookieMissions.every((m) => m.story && m.objective && m.landmark));
});

test("story completion is derived only from completed real lessons", () => {
  const state = rookieStoryState({ completed: [], steps: { variables: ["see", "predict", "build"] } });
  assert.equal(state.finished, 0);
  assert.equal(state.missions[0].status, "in-progress");
  assert.equal(state.districtState, "waiting");
  assert.equal(state.next.lessonId, "variables");
});

test("each genuinely completed lesson restores exactly one landmark", () => {
  const state = rookieStoryState({ completed: ["variables", "strings", "conditions"], steps: {} });
  assert.equal(state.finished, 3);
  assert.equal(state.districtState, "restored");
  assert.ok(state.missions.every((m) => m.status === "complete"));
});

test("no score is invented from progress in unrelated lessons", () => {
  const state = rookieStoryState({
    completed: ["methods", "arrays", "events", "validation"],
    steps: { methods: ["apply"], strings: ["see"] },
  });
  assert.equal(state.finished, 0);
  assert.equal(state.missions[1].status, "in-progress");
  assert.equal(state.next.lessonId, "variables");
});

test("repeat and malformed external progress do not create extra milestones", () => {
  assert.equal(rookieStoryState({ completed: ["variables", "variables"], steps: {} }).finished, 1);
  assert.equal(rookieStoryState({ completed: [], steps: {} }).finished, 0);
  assert.equal(rookieStoryState({}).finished, 0);
});
