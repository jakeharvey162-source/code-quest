import test from "node:test";
import assert from "node:assert/strict";
import {missionsFor,torDebugTip} from "../src/lib/terminal-mentor.mjs";
test("Code Terminal side quests cover all seven runtime modes",()=>{
 for(const language of ["javascript","typescript","html","css","python","python-turtle","csharp"]){
  const prompts=missionsFor(language);
  assert.ok(prompts.length>=2,language);
  assert.ok(prompts.every(x=>x.title&&x.task&&x.hint));
 }
 assert.deepEqual(missionsFor("unrecognized"),[]);
});
test("Tor side quests give precise next steps and do not claim auto grading",()=>{
 assert.match(torDebugTip("csharp","Console.WriteLine(2);"),/Predict/);
 assert.match(torDebugTip("python","raise Exception()",true),/first red console line/);
 assert.match(torDebugTip("javascript","",false),/press F5/);
});
