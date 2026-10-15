import test from "node:test";
import assert from "node:assert/strict";
import { createTorHandler, TOR_MODEL } from "../server/tor-handler.mjs";

async function send({ status = 200, providerCode, mode = "gemini" } = {}) {
  const calls = [];
  let oldQuota = 0;
  const handler = createTorHandler({
    env: mode === "gemini" ? {} : { VERCEL_OIDC_TOKEN: "private", CQ_TOR_PROVIDER: "vercel" },
    supabaseUrl: "https://example.supabase.co",
    supabaseApiKey: "publishable",
    authenticate: async () => ({ id: "student" }),
    reserve: async () => { oldQuota++; return true; },
    fetcher: async (url, options) => {
      calls.push({ url, options });
      if (url.includes("codequest-tor-gemini")) {
        return Response.json(status === 200
          ? { text: "Try a WinForms Click handler.", model: "gemini-2.5-flash" }
          : { code: providerCode || "unavailable", error: "Try again." },
        { status });
      }
      if (url.endsWith("/models"))
        return Response.json({ data: [{ id: TOR_MODEL, pricing: { input: "0", output: "0" } }] });
      return Response.json({ choices: [{ message: { content: "Fallback answer" } }] });
    },
  });
  let result = {};
  const res = {
    setHeader() {},
    status(value) { this.code = value; return this; },
    json(value) { result = { status: this.code, ...value }; return this; },
  };
  await handler({
    method: "POST",
    headers: {
      origin: "https://code-quest-tau-woad.vercel.app",
      authorization: "Bearer test-session",
      "content-type": "application/json",
    },
    body: { messages: [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi!" },
      { role: "user", content: "How do I handle a Click?" },
    ] },
  }, res);
  return { calls, result, oldQuota };
}

test("Tor uses the same-project Gemini gateway and never double-reserves usage", async () => {
  const { calls, result, oldQuota } = await send();
  assert.equal(result.status, 200);
  assert.equal(result.model, "gemini-2.5-flash");
  assert.equal(oldQuota, 0);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.headers.Authorization, "Bearer test-session");
  assert.equal(calls[0].options.headers.apikey, "publishable");
  assert.equal(JSON.parse(calls[0].options.body).messages.at(-1).role, "user");
});

test("Gemini quota errors do not route around rate limits", async () => {
  const { calls, result, oldQuota } = await send({ status: 429, providerCode: "rate_limited" });
  assert.equal(result.status, 429);
  assert.equal(calls.length, 1);
  assert.equal(oldQuota, 0);
});

test("Only missing Gemini setup falls back to the existing model", async () => {
  const { calls, result, oldQuota } = await send({ status: 503, providerCode: "setup_required" });
  assert.equal(result.status, 503);
  assert.equal(result.code, "setup_required");
  assert.equal(calls.length, 1);
  assert.equal(oldQuota, 0);
});
