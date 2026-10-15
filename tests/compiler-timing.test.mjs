import { test } from "node:test";
import assert from "node:assert/strict";
import { runCSharp } from "../src/lib/compiler.ts";
test("slow preparation does not consume the execution limit; stopped runs can recover", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let current;
  class WorkerStub {
    constructor() {
      current = this;
    }
    postMessage() {}
    terminate() {
      this.stopped = true;
    }
    send(data) {
      this.onmessage({ data });
    }
  }
  t.mock.method(globalThis, "setTimeout", globalThis.setTimeout);
  const old = globalThis.Worker;
  globalThis.Worker = WorkerStub;
  try {
    const pending = runCSharp("return 0;");
    const rejected = assert.rejects(pending, /does not prove an infinite loop/);
    current.send({ type: "status", text: "Preparing the first C# run…" });
    t.mock.timers.tick(15000);
    assert.equal(current.stopped, undefined);
    current.send({ type: "compiling" });
    t.mock.timers.tick(15000);
    assert.equal(current.stopped, undefined);
    current.send({ type: "running" });
    t.mock.timers.tick(9999);
    assert.equal(current.stopped, undefined);
    t.mock.timers.tick(1);
    await rejected;
    assert.equal(current.stopped, true);
    const recovery = runCSharp("using System; Console.WriteLine(0);");
    current.send({
      type: "result",
      result: { success: true, stdOut: "0", stdErr: "", diagnostics: [] },
    });
    assert.equal((await recovery).stdOut, "0");
  } finally {
    globalThis.Worker = old;
    t.mock.timers.reset();
  }
});
