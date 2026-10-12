import test from "node:test";
import assert from "node:assert/strict";
import {TOR_LANGUAGES,localizedLesson,localizedChallenge} from "../src/lib/tor-teaching.mjs";
test("Tor roast mode varies jokes while still teaching real code",()=>{
 const jokes=[0,1,2].map(i=>localizedLesson("debug this error","en-ZA",true,i));
 assert.equal(new Set(jokes).size,3);
 assert.ok(jokes.every(x=>x.includes("Read the first error")));
 assert.equal(localizedLesson("loop","en-ZA",false,3),localizedLesson("loop","en-ZA"));
});
test("Every teaching language offers actionable coding challenges and contextual roasts",()=>{
 for(const {code} of TOR_LANGUAGES){
  for(const question of ["label","button click","validate number","for loop","class object","debug error"]){
   const challenge=localizedChallenge(question,code),roast=localizedLesson(question,code,true,1);
   assert.ok(challenge.length>45,code+" "+question);
   assert.ok(roast.length>80);
   assert.notEqual(roast,localizedLesson(question,code,false));
  }
 }
});
