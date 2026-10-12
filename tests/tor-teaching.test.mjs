import test from "node:test";
import assert from "node:assert/strict";
import { TOR_LANGUAGES, teachingTopic, localizedLesson, localizedFallback } from "../src/lib/tor-teaching.mjs";
test("Tor has meaningful authored help in five languages for six coding topics",()=>{
 assert.deepEqual(TOR_LANGUAGES.map(x=>x.code),["en-ZA","zu-ZA","fr-FR","pt-PT","sw-KE"]);
 const questions=["How do I use Label?","How does button Click work?","How can I validate a number?","Explain a for loop","What is a class?","How do I debug this error?"];
 const languages=TOR_LANGUAGES.map(x=>x.code);
 for(const lang of languages){
  for(const question of questions){
   const lesson=localizedLesson(question,lang);
   assert.ok(lesson && lesson.length>70,lang+" "+question);
   assert.ok(localizedLesson(question,lang,true).length>lesson.length,lang+" roast "+question);
  }
  assert.ok(localizedFallback(lang).length>50);
 }
 assert.equal(teachingTopic("I don't understand this"),null);
 assert.equal(localizedLesson("What's the weather?", "en-ZA"),null);
});
test("Roasts are contextual and include actual teaching instead of repetitive insults",()=>{
 const x=localizedLesson("label","en-ZA",true),y=localizedLesson("loop","en-ZA",true);
 assert.match(x,/TextBox/);
 assert.match(y,/i = 0, 1, 2/);
 assert.notEqual(x.split(".")[0],y.split(".")[0]);
 assert.match(localizedLesson("button click","fr-FR",true),/événement Click/);
});
