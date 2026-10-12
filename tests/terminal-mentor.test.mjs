import test from "node:test";
import assert from "node:assert/strict";
import {missionsFor,torDebugTip} from "../src/lib/terminal-mentor.mjs";
test("every supported terminal language has offline Tor challenges", () => {
 for(const key of ["javascript","typescript","html","css","python","python-turtle","csharp"]) {
  const entries=missionsFor(key);
  assert.ok(entries.length>0, key);
  for(const item of entries) {
   assert.ok(item.title && item.task && item.hint);
  }
 }
 assert.deepEqual(missionsFor("not-a-runtime"), []);
});
test("Tor teaches rather than pretending to run or grade arbitrary code", () => {
 assert.match(torDebugTip("javascript","",false), /press F5/i);
 assert.match(torDebugTip("csharp","Console.WriteLine(4);"), /predict/i);
 assert.match(torDebugTip("python","bad",true), /first red console line/i);
});
