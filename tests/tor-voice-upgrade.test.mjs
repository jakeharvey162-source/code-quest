import test from "node:test";
import assert from "node:assert/strict";
import {commandFor,speakText,stopSpeech} from "../src/lib/voice.ts";
test("Tor understands Code Terminal navigation spoken in five languages",()=>{
 for(const phrase of ["open code terminal","open terminal","ouvre terminal","vula itheminali","abrir terminal","fungua terminal"])
  assert.equal(commandFor(phrase),"terminal",phrase);
 assert.equal(commandFor("show code lab"),"playground");
});
test("Tor reads a long lesson in mobile-sized utterances and can cancel midway",()=>{
 const voices=[{name:"English voice",lang:"en-ZA"}],spoken=[],status=[];
 globalThis.window={speechSynthesis:{getVoices:()=>voices,cancel(){},speak(u){spoken.push(u)}}};
 globalThis.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};
 window.SpeechSynthesisUtterance=globalThis.SpeechSynthesisUtterance;
 try{
  const lesson=("Read the first error. Then change one thing and run it again. ").repeat(12);
  assert.equal(speakText(lesson,"",1,s=>status.push(s),"en-ZA"),true);
  assert.equal(spoken.length,1);
  for(let n=0;n<30 && spoken.at(-1).onend;n++){
   const u=spoken.at(-1);
   u.onstart?.();
   u.onend();
   if(status.at(-1)==="Finished reading.")break;
  }
  assert.equal(status.at(-1),"Finished reading.");
  assert.ok(spoken.length>3);
  assert.ok(spoken.every(x=>x.text.length<=190));
  assert.equal(spoken.map(x=>x.text).join(" "),lesson.trim());
  speakText(lesson,"",1,s=>status.push(s),"en-ZA");
  const late=spoken.at(-1);
  stopSpeech();
  late.onend?.();
  assert.notEqual(status.at(-1),"Finished reading.");
 }finally{stopSpeech();delete globalThis.window;delete globalThis.SpeechSynthesisUtterance}
});
