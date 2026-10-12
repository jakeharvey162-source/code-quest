import test from "node:test";
import assert from "node:assert/strict";
import {speakText,stopSpeech} from "../src/lib/voice.ts";
test("speech drives the mouth on start, word boundaries and final end",()=>{
 const played=[],signals=[],statuses=[];
 const voice={name:"Tor English",lang:"en-ZA"};
 globalThis.window={speechSynthesis:{getVoices:()=>[voice],cancel(){},speak(u){played.push(u)}}};
 globalThis.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};
 window.SpeechSynthesisUtterance=globalThis.SpeechSynthesisUtterance;
 try{
  const phrase="Hello! ".repeat(42);
  speakText(phrase,"",1,s=>statuses.push(s),"en-ZA",(active,index)=>signals.push({active,index}));
  assert.equal(played.length,1);
  const first=played.at(-1);
  first.onstart();
  first.onboundary({charIndex:4});
  assert.equal(signals.at(-1).active,true);
  assert.equal(signals.at(-1).index,4);
  first.onend();
  assert.equal(played.length,2);
  assert.notEqual(signals.at(-1).active,false,"mouth stays active between chunks");
  for(let i=0;i<15&&statuses.at(-1)!=="Finished reading.";i++){
   const chunk=played.at(-1);
   chunk.onstart();
   chunk.onend();
  }
  assert.equal(statuses.at(-1),"Finished reading.");
  assert.equal(signals.at(-1).active,false);
 }finally{stopSpeech();delete globalThis.window;delete globalThis.SpeechSynthesisUtterance}
});
test("stopping during active voice immediately closes mouth and suppresses stale boundary events",()=>{
 const spoken=[],signals=[];
 globalThis.window={speechSynthesis:{getVoices:()=>[{name:"Tor",lang:"en-ZA"}],cancel(){},speak(u){spoken.push(u)}}};
 globalThis.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};
 window.SpeechSynthesisUtterance=globalThis.SpeechSynthesisUtterance;
 try{
  speakText("A student can learn from a mistake.","",1,()=>{},"en-ZA",active=>signals.push(active));
  const utterance=spoken.at(-1);
  utterance.onstart();
  assert.equal(signals.at(-1),true);
  stopSpeech();
  assert.equal(signals.at(-1),false);
  const count=signals.length;
  utterance.onboundary({charIndex:9});utterance.onend();
  assert.equal(signals.length,count);
 }finally{stopSpeech();delete globalThis.window;delete globalThis.SpeechSynthesisUtterance}
});
