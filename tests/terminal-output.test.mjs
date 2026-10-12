import test from "node:test";
import assert from "node:assert/strict";
import {outputKind,languageMismatch,noOutputHint} from "../src/lib/terminal-output.mjs";
test("text-oriented programs show a big output panel rather than a blank canvas",()=>{
 for(const lang of ["javascript","typescript","python","csharp"])
  assert.equal(outputKind(lang,"console.log('hello')"),"text",lang);
 for(const lang of ["html","css","python-turtle"])assert.equal(outputKind(lang,"<h1>Hi</h1>"),"visual",lang);
 assert.equal(outputKind("javascript","const c=document.querySelector('canvas'); c.getContext('2d');"),"visual");
 assert.equal(outputKind("typescript","const canvas = document.querySelector<HTMLCanvasElement>('#art')!;"),"visual");
 assert.equal(outputKind("javascript","requestAnimationFrame(draw)"),"visual");
});
test("detect genuine pasted language mismatches rather than silently producing no output",()=>{
 assert.equal(languageMismatch("javascript","print('hey')").language,"python");
 assert.equal(languageMismatch("javascript","using System; Console.WriteLine(3);").language,"csharp");
 assert.equal(languageMismatch("python","<html><h1>Hi</h1></html>").language,"html");
 assert.equal(languageMismatch("javascript","#include <iostream>\nint main() { }").label,"C++");
 assert.equal(languageMismatch("javascript","console.log('hey')"),null);
 assert.equal(languageMismatch("python","print('hey')"),null);
 assert.equal(languageMismatch("csharp","using System; Console.WriteLine(3);"),null);
});
test("no-output hints are explicit and language appropriate",()=>{
 assert.match(noOutputHint("javascript"),/console.log/);
 assert.match(noOutputHint("python"),/print/);
 assert.match(noOutputHint("csharp"),/Console.WriteLine/);
});
