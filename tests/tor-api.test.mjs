import { test } from "node:test";
import assert from "node:assert/strict";
import handler from "../api/tor.mjs";

function invoke(method, body = {}, authorization = "") {
  return new Promise((resolve, reject) => {
    const response = {
      statusCode: 200,
      headers: {},
      setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
      end(raw) { resolve({ status: this.statusCode, headers: this.headers, body: JSON.parse(raw) }); },
    };
    Promise.resolve(handler({ method, body, headers: { authorization } }, response)).catch(reject);
  });
}
test("Tor endpoint does not pretend to have AI without a server key", async () => {
  const old = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    const response = await invoke("POST", {message: "hey"});
    assert.equal(response.status, 503);
    assert.match(response.body.error, /not configured/);
    assert.equal(response.headers["cache-control"], "no-store");
    assert.equal((await invoke("GET")).status, 405);
  } finally {
    if (old === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = old;
  }
});
test("Tor endpoint rejects anonymous and malformed requests without billing Gemini", async () => {
  const old = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "test-do-not-call";
  try {
    assert.equal((await invoke("POST", {message: "hello"})).status, 401);
    assert.equal((await invoke("POST", {message: ""}, "Bearer test-token")).status, 400);
    assert.equal((await invoke("POST", {message: "x".repeat(1600)}, "Bearer test-token")).status, 400);
  } finally {
    if (old === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = old;
  }
});
