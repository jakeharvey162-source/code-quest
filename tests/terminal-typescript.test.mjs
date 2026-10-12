import test from "node:test";
import assert from "node:assert/strict";
import {compileTerminalTypeScript} from "../src/lib/terminal-typescript.mjs";
test("TypeScript transpiles typed Canvas-ready JavaScript",()=>{
 const r=compileTerminalTypeScript("const answer: number = 42; console.log('Result: ' + answer);");
 assert.equal(r.success,true,r.diagnostics.join("; "));
 assert.match(r.code,/console\.log/);
 assert.doesNotMatch(r.code,/answer:\s*number/);
});
test("TypeScript syntax errors and imports do not execute",()=>{
 const bad=compileTerminalTypeScript("const broken: = 7;");
 assert.equal(bad.success,false);
 assert.equal(bad.code,"");
 assert.match(bad.diagnostics.join(" "),/TS\d+/);
 const remote=compileTerminalTypeScript("import {x} from 'remote-package'; console.log(x);");
 assert.equal(remote.success,false);
 assert.match(remote.diagnostics.join(" "),/Modules\/imports/);
});
