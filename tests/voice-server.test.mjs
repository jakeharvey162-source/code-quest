import test from "node:test";
import assert from "node:assert/strict";
import { createVoiceHandler } from "../server/voice-handler.mjs";
const env = {
  ELEVENLABS_API_KEY: "test",
  VITE_SUPABASE_URL: "https://example.supabase.co",
  VITE_SUPABASE_PUBLISHABLE_KEY: "test",
  PUBLIC_APP_URL: "https://codequest.example",
};
async function run({
  request = {},
  user = true,
  allowed = true,
  quotaError = null,
  providerError = false,
  configured = true,
} = {}) {
  let generated = 0,
    reserved = 0,
    chosen;
  const handler = createVoiceHandler({
    env: configured ? env : {},
    createUserClient: () => ({
      auth: {
        getUser: async () => ({
          data: { user: user ? { id: "verified" } : null },
          error: null,
        }),
      },
      rpc: async () => {
        reserved++;
        return { data: allowed, error: quotaError };
      },
    }),
    convert: async (id, options) => {
      generated++;
      chosen = { id, ...options };
      if (providerError) throw Error("Secret provider error");
      return new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]));
          controller.close();
        },
      });
    },
  });
  const res = {
    headers: {},
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.code = code;
      return this;
    },
    json(value) {
      this.body = value;
    },
    send(value) {
      this.body = value;
    },
  };
  await handler(
    {
      method: "POST",
      headers: {
        authorization: "Bearer valid",
        origin: env.PUBLIC_APP_URL,
        "content-type": "application/json",
      },
      body: { language: "sw-KE", text: "Karibu CodeQuest." },
      ...request,
    },
    res,
  );
  return { res, generated, reserved, chosen };
}
test("cloud voice verifies session, reserves allowance and uses language-specific model", async () => {
  const r = await run();
  assert.equal(r.res.code, 200);
  assert.equal(r.chosen.modelId, "eleven_v3");
  assert.equal(r.chosen.id, "i5oE89JoUCpIgvSOemWx");
  assert.equal(r.res.headers["Cache-Control"], "private, no-store");
});
test("unauthenticated, exhausted and unconfigured requests never generate audio", async () => {
  for (const [options, status] of [
    [{ user: false }, 401],
    [{ allowed: false }, 429],
    [{ configured: false }, 503],
    [{ quotaError: Error("database") }, 503],
  ]) {
    const r = await run(options);
    assert.equal(r.res.code, status);
    assert.equal(r.generated, 0);
  }
});
test("voice endpoint rejects arbitrary voices, missing languages, long text and foreign origins", async () => {
  for (const request of [
    { body: { language: "zu-ZA", text: "Hello" } },
    { body: { language: "en-ZA", text: "a".repeat(801) } },
    { headers: { origin: "https://attacker.example" } },
  ]) {
    const r = await run({ request });
    assert.ok([400, 403].includes(r.res.code));
    assert.equal(r.generated, 0);
    assert.equal(r.reserved, 0);
  }
});
test("voice provider failures return a safe actionable message", async () => {
  const r = await run({ providerError: true });
  assert.equal(r.res.code, 503);
  assert.doesNotMatch(JSON.stringify(r.res.body), /Secret/);
});
