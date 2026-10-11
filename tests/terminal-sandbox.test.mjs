import test from "node:test";
import assert from "node:assert/strict";
import {LANGUAGES,encodeSharedProgram,decodeSharedProgram,buildPreviewDocument,safeScript,validateSource} from "../src/lib/terminal-sandbox.mjs";
import {TERMINAL_EXAMPLES,exampleFor} from "../src/lib/terminal-examples.mjs";
const token="9a58f433-68d3-4b51-a354-7e8843d676cc";
test("all supported language demos are editable source code",()=>{
 assert.deepEqual(LANGUAGES,["javascript","html","css","python","csharp"]);
 for(const language of LANGUAGES){
  const example=exampleFor(language);
  assert.ok(example?.source.length>30);
  assert.ok(example.source.length<60000);
 }
});
test("share links support Unicode birthday wishes and reject malformed content",()=>{
 const program={language:"javascript",source:"console.log('I love you ♥ 🌹');"};
 assert.deepEqual(decodeSharedProgram(encodeSharedProgram(program.language,program.source)),program);
 assert.throws(()=>decodeSharedProgram("%20"));
 assert.throws(()=>decodeSharedProgram("eyJ2IjoxLCJsYW5ndWFnZSI6InJ1YnkiLCJzb3VyY2UiOiIifQ"));
 assert.throws(()=>encodeSharedProgram("javascript","x".repeat(2801)));
 assert.throws(()=>validateSource("x".repeat(60001)));
});
test("JS sandbox refuses same-origin and network, preserves console capture and canvas",()=>{
 const doc=buildPreviewDocument("javascript",exampleFor("javascript","heart").source,token);
 assert.match(doc,/sandbox preview|<canvas id="art"/);
 assert.match(doc,/default-src &#39;none&#39;/);
 assert.match(doc,/connect-src &#39;none&#39;/);
 assert.match(doc,/channel:"cq-terminal"/);
 assert.match(doc,/requestAnimationFrame/);
 assert.doesNotMatch(doc,/allow-same-origin/);
});
test("script close injection cannot break the script tag and all web previews are sandboxed",()=>{
 assert.equal(safeScript("</script><script>alert(1)</script>"),"<\\/script><script>alert(1)<\\/script>");
 for(const lang of ["html","css","javascript","python"]){
  const doc=buildPreviewDocument(lang,"console.log('hello')",token);
  assert.match(doc,/Content-Security-Policy/);
  assert.match(doc,/token/);
 }
});
test("Python loads worker-only Pyodide and cannot access CodeQuest's runtime origin",()=>{
 const doc=buildPreviewDocument("python",exampleFor("python").source,token);
 assert.match(doc,/new Worker\(url\)/);
 assert.match(doc,/pyodide\/v0\.27\.7\/full/);
 assert.match(doc,/indexURL/);
 assert.match(doc,/parent\.postMessage/);
 assert.match(doc,/worker-src blob:/);
});
