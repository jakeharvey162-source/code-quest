import test from "node:test";
import assert from "node:assert/strict";
import { terminalCSharpSource, terminalStdout } from "../src/lib/terminal-input.mjs";
test("console adaptation leaves quoted/commented code untouched and preserves partial Write output",()=>{
 const source='using System;\n// Console.ReadLine()\nConsole.WriteLine("Console.Write stays text");\nstring name=System.Console.ReadLine(); Console.Write(name);';
 const prepared=terminalCSharpSource(source,'Ada\n250');
 assert.match(prepared.source,/\/\/ Console.ReadLine\(\)/);assert.match(prepared.source,/"Console.Write stays text"/);
 assert.doesNotMatch(prepared.source,/name=System.Console.ReadLine/);assert.match(prepared.source,/new string\[\]\{@"Ada",@"250"\}/);
 assert.equal(terminalStdout(prepared.marker+btoa('Name: ')+'\nWelcome Ada\n',prepared.marker),'Name: Welcome Ada\n');
 assert.throws(()=>terminalCSharpSource(source,'x'.repeat(20001)));
});
