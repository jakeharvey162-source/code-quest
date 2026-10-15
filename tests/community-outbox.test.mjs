import test from "node:test";
import assert from "node:assert/strict";
import {
  flushOutbox,
  mergeMessages,
  validateMessage,
  CommunityStore,
} from "../src/community/store.mjs";
function memory(owner) {
  const rows = new Map();
  return {
    owner,
    list: async () => [...rows.values()],
    put: async (_kind, id, v) => rows.set(id, v),
    remove: async (_kind, id) => rows.delete(id),
  };
}
const item = (id) => ({
  id,
  room_id: "room",
  sender_id: "a",
  body: "Question " + id,
  code: "",
  language: "csharp",
  created_at: "2026-10-14T01:00:00Z",
  state: "queued",
});
test("outbox pauses on network/auth failures, retains identifiers and acknowledges only successful delivery", async () => {
  const store = memory("network-test");
  await store.put("outbox", "1", item("1"));
  await store.put("outbox", "2", item("2"));
  await flushOutbox(store, async () => {
    throw { code: "AUTH", message: "Sign in first" };
  });
  assert.equal((await store.list()).length, 2);
  assert.equal((await store.list())[0].id, "1");
  const sent = [];
  await flushOutbox(store, async (row) => sent.push(row.id));
  assert.deepEqual(sent, ["1", "2"]);
  assert.equal((await store.list()).length, 0);
});
test("permission failures remain visible for editing; another queued message can still send", async () => {
  const store = memory("permission-test");
  await store.put("outbox", "1", item("1"));
  await store.put("outbox", "2", item("2"));
  await flushOutbox(store, async (row) => {
    if (row.id === "1") throw { code: "42501", message: "Friendship ended" };
  });
  assert.equal((await store.list()).length, 1);
  assert.equal((await store.list())[0].state, "failed");
  let sends = 0;
  await flushOutbox(store, async () => sends++);
  assert.equal(sends, 0);
});
test("overlapping sync calls serialize a single account while other accounts stay independent", async () => {
  const a = memory("parallel-a"),
    b = memory("parallel-b");
  await a.put("outbox", "1", item("1"));
  await b.put("outbox", "1", item("1"));
  let release;
  const gate = new Promise((r) => (release = r));
  let aSends = 0,
    bSends = 0;
  const first = flushOutbox(a, async () => {
    aSends++;
    await gate;
  });
  const second = flushOutbox(a, async () => aSends++);
  await flushOutbox(b, async () => bSends++);
  release();
  await Promise.all([first, second]);
  assert.equal(aSends, 1);
  assert.equal(bSends, 1);
});
test("server acknowledgements replace queued copies and preserve independent message order", () => {
  const pending = [item("1"), item("2")],
    server = [
      { ...item("1"), body: "confirmed", created_at: "2026-10-14T01:01:00Z" },
    ];
  const rows = mergeMessages(server, pending);
  assert.equal(rows.length, 2);
  assert.equal(rows[1].body, "confirmed");
  assert.equal(rows[1].state, "sent");
});
test("unsafe message sizes, unsupported language and unavailable storage fail before sending", async () => {
  assert.throws(
    () => validateMessage({ ...item("x"), body: " ", code: "" }),
    /Write a message/,
  );
  assert.throws(
    () => validateMessage({ ...item("x"), body: "x".repeat(4001) }),
    /4,000/,
  );
  assert.throws(
    () => validateMessage({ ...item("x"), language: "shell" }),
    /supported/,
  );
  validateMessage({ ...item("x"), body: "", challenge_id: "bill-total" });
  await assert.rejects(
    new CommunityStore("a", null).put("draft", "x", item("x")),
    /storage is unavailable/,
  );
  assert.notEqual(
    new CommunityStore("a").id("draft", "room"),
    new CommunityStore("b").id("draft", "room"),
  );
});

test("backend setup and permission failures give useful messages without exposing table names", async () => {
  const { communityError } = await import("../src/community/errors.mjs");
  assert.match(
    communityError({
      code: "PGRST205",
      message: "Could not find public.cq_community_messages",
    }),
    /being set up/,
  );
  assert.doesNotMatch(
    communityError({
      code: "42501",
      message: "RLS cq_community_messages failed",
    }),
    /cq_community/,
  );
  assert.match(
    communityError({ message: "Failed to fetch" }),
    /queued messages stay saved/,
  );
});
