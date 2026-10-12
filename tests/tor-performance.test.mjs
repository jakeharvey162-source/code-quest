import test from "node:test";
import assert from "node:assert/strict";
import {TOR_REACTIONS,clipForMood,chooseTorReaction,mouthLevel,reactionLine} from "../src/lib/tor-performance.mjs";
test("Tor uses only existing licensed RobotExpressive gestures",()=>{
 const clips=new Set(["ThumbsUp","Dance","Jump","No","Wave","Yes","Idle","Walking"]);
 for(const item of Object.values(TOR_REACTIONS)){assert.ok(clips.has(item.clip));assert.ok(item.duration>1);}
 assert.equal(clipForMood("happy"),"ThumbsUp");
 assert.equal(clipForMood("cheeky"),"Dance");
 assert.equal(chooseTorReaction("dance").clip,"Dance");
});
test("speech drives a variable mouth and respects reduced motion",()=>{
 assert.equal(mouthLevel(1,false,3),0);
 assert.equal(mouthLevel(1,true,3,true),0.34);
 const a=mouthLevel(.2,true,1),b=mouthLevel(.7,true,2);
 assert.ok(a>.1&&a<=.97);
 assert.ok(b>.1&&b<=.97);
 assert.notEqual(a,b);
});
test("reaction quips encourage learning in all teaching languages",()=>{
 for(const locale of ["en-ZA","zu-ZA","fr-FR","pt-PT","sw-KE"]){
  for(const key of Object.keys(TOR_REACTIONS)) assert.ok(reactionLine(key,locale).length>35);
 }
 assert.match(reactionLine("nope","en-ZA"),/first error/);
});
