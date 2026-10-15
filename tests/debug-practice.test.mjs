import { test } from "node:test";
import assert from "node:assert/strict";
import { traceProgram, readTrace } from "../src/lib/debug-practice.mjs";
test("trace probes preserve source lines and ignore strings and block comments", () => {
  const source =
    'string text = @"hello\n// @trace fake\n";\n/*\n// @trace fake\n*/\nint count=0;\n// @trace count\ncount++;';
  const result = traceProgram(source, "TOKEN");
  assert.deepEqual(result.points, [{ line: 8, watches: ["count"] }]);
  assert.match(result.source, /Capture\(8/);
  assert.match(result.source, /\/\/ @trace fake/);
  assert.throws(
    () => traceProgram("// @trace count++", "TOKEN"),
    /simple variable/,
  );
});
test("trace replay retains loop snapshots and output chronology", () => {
  const result = readTrace("hello\nT|3|MA==\nT|3|MQ==\nfinished\n", "T", [
    { line: 3, watches: ["count"] },
  ]);
  assert.equal(result.frames.length, 2);
  assert.equal(result.frames[0].watches[0].value, "0");
  assert.equal(result.frames[1].watches[0].value, "1");
  assert.equal(result.frames[1].output, "hello\n");
  assert.equal(result.output, "hello\nfinished\n");
});
