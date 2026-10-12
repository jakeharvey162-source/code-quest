import test from "node:test";
import assert from "node:assert/strict";
import {LANGUAGES,encodeSharedProgram,decodeSharedProgram,buildPreviewDocument,safeScript,validateSource} from "../src/lib/terminal-sandbox.mjs";
import {TERMINAL_EXAMPLES,exampleFor} from "../src/lib/terminal-examples.mjs";
const token="9a58f433-68d3-4b51-a354-7e8843d676cc";
test("all supported language demos are editable source code",()=>{
 assert.deepEqual(LANGUAGES,["javascript","typescript","html","css","python","python-turtle","csharp"]);
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
 for(const lang of ["html","css","javascript","typescript","python","python-turtle"]){
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

test("Turtle example matches genuine Python turtle module and uses isolated Skulpt graphics renderer",()=>{
 const example=exampleFor("python-turtle","heart");
 assert.match(example.source,/import turtle/);
 assert.match(example.source,/pen\.write/);
 const frame=buildPreviewDocument("python-turtle",example.source,token);
 assert.match(frame,/skulpt@1\.2\.0/);
 assert.match(frame,/Sk\.TurtleGraphics/);
 assert.match(frame,/id="mycanvas"/);
 assert.match(frame,/default-src &#39;none&#39;/);
});

test("TypeScript preview executes transpiled JavaScript in the opaque canvas sandbox",()=>{
 const doc=buildPreviewDocument("typescript","const greeting: string = 'Hello'; console.log(greeting)",token);
 assert.match(doc,/canvas id="art"/);
 assert.match(doc,/typescript@5\.9\.3/);
 assert.match(doc,/ts\.transpileModule/);
 assert.match(doc,/const greeting/);
 assert.match(doc,/connect-src &#39;none&#39;/);
});
test("Python and Turtle failures report fatal events for immediate recovery",()=>{
 const py=buildPreviewDocument("python","raise ValueError('boom')",token);
 const turtle=buildPreviewDocument("python-turtle","raise ValueError('boom')",token);
 assert.match(py,/fatal/);
 assert.match(py,/window.__cqSend\("fatal"/);
 assert.match(turtle,/window.__cqSend\("fatal"/);
});
