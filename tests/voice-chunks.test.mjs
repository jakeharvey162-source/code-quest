import test from "node:test";
import assert from "node:assert/strict";
import {speechChunks} from "../src/lib/voice-chunks.mjs";
test("voice chunks preserve words, punctuation and long feedback",()=>{
 const source=("Read the first error. Check the variable name. Fix one thing at a time! ").repeat(22).trim();
 const chunks=speechChunks(source);
 assert.ok(chunks.length>4);
 assert.ok(chunks.every(x=>x.length<=190 && x.length>0));
 assert.equal(chunks.join(" "),source);
});
test("voice chunking limits giant tokens and treats empty speech safely",()=>{
 assert.deepEqual(speechChunks(" \n "),[]);
 const result=speechChunks("x".repeat(520));
 assert.equal(result.join(""),"x".repeat(520));
 assert.ok(result.every(x=>x.length<=190));
});
