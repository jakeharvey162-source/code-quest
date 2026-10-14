import test from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
const A = "11111111-1111-4111-8111-111111111111",
  B = "22222222-2222-4222-8222-222222222222",
  C = "33333333-3333-4333-8333-333333333333";
const migration = new URL(
  "../supabase/migrations/20261014052709_codequest_community.sql",
  import.meta.url,
);
async function setup() {
  const db = new PGlite();
  await db.exec(
    `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('${A}'),('${B}'),('${C}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`,
  );
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/20261007141701_codequest_accounts_classes.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.exec(await readFile(migration, "utf8"));
  const as = async (id, sql, params = []) => {
    await db.exec(
      `reset role;set role ${id ? "authenticated" : "anon"};set request.jwt.claim.sub='${id || ""}';`,
    );
    return db.query(sql, params);
  };
  for (const id of [A, B, C])
    await as(
      id,
      "insert into cq_community_profiles(user_id,nickname,allow_requests) values($1,$2,true)",
      [id, "Builder " + id[0]],
    );
  const room = (
    await as(A, "select id from cq_community_rooms where slug='csharp'")
  ).rows[0].id;
  return { db, as, room };
}
test("public messages persist between two authenticated users; RPC retries are idempotent, sender and timestamps cannot be forged", async () => {
  const { db, as, room } = await setup();
  try {
    const id = crypto.randomUUID();
    const send = (actor, body = "Hello") =>
      as(actor, "select * from cq_community_send($1,$2,$3,$4,$5)", [
        id,
        room,
        body,
        "",
        "csharp",
      ]);
    assert.equal((await send(A)).rows.length, 1);
    assert.equal(
      (await as(B, "select * from cq_community_messages")).rows[0].body,
      "Hello",
    );
    await send(A);
    assert.equal(
      (await as(A, "select * from cq_community_messages")).rows.length,
      1,
    );
    await assert.rejects(send(A, "Changed payload"), /identifier/);
    await assert.rejects(send(B), /identifier/);
    await assert.rejects(
      as(
        B,
        "insert into cq_community_messages(id,room_id,sender_id,body) values($1,$2,$3,$4)",
        [crypto.randomUUID(), room, A, "spoof"],
      ),
      /unavailable|security/,
    );
    await assert.rejects(
      as(A, "update cq_community_messages set body=$1", ["tamper"]),
      /permission denied/,
    );
    await assert.rejects(
      as(
        A,
        "insert into cq_community_messages(id,room_id,sender_id,body,created_at) values($1,$2,$3,$4,now())",
        [crypto.randomUUID(), room, A, "fake time"],
      ),
      /permission denied/,
    );
    await assert.rejects(
      as(null, "select * from cq_community_messages"),
      /permission denied/,
    );
  } finally {
    await db.close();
  }
});
test("DM requires recipient consent; third users, removed friends and either-sided blocks lose access", async () => {
  const { db, as, room } = await setup();
  try {
    await assert.rejects(
      as(A, "select cq_community_dm($1)", [B]),
      /accepted friends/,
    );
    await assert.rejects(
      as(A, "insert into cq_community_friends values($1,$2,'accepted',now())", [
        A,
        B,
      ]),
      /security/,
    );
    await as(
      A,
      "insert into cq_community_friends(requester,recipient) values($1,$2)",
      [A, B],
    );
    assert.equal(
      (
        await as(
          A,
          "update cq_community_friends set status='accepted' returning *",
        )
      ).rows.length,
      0,
    );
    await as(B, "update cq_community_friends set status='accepted'");
    const dm = (await as(A, "select cq_community_dm($1) id", [B])).rows[0].id;
    await as(A, "select * from cq_community_send($1,$2,$3,$4,$5)", [
      crypto.randomUUID(),
      dm,
      "Private message",
      "",
      "python",
    ]);
    assert.equal(
      (
        await as(B, "select * from cq_community_messages where room_id=$1", [
          dm,
        ])
      ).rows.length,
      1,
    );
    assert.equal(
      (
        await as(C, "select * from cq_community_messages where room_id=$1", [
          dm,
        ])
      ).rows.length,
      0,
    );
    await assert.rejects(
      as(C, "select * from cq_community_send($1,$2,$3,$4,$5)", [
        crypto.randomUUID(),
        dm,
        "Intrusion",
        "",
        "csharp",
      ]),
      /unavailable/,
    );
    await as(B, "insert into cq_community_blocks values($1,$2)", [B, A]);
    assert.equal(
      (await as(A, "select * from cq_community_rooms where id=$1", [dm])).rows
        .length,
      0,
    );
    assert.equal(
      (
        await as(A, "select * from cq_community_messages where room_id=$1", [
          dm,
        ])
      ).rows.length,
      0,
    );
    await assert.rejects(
      as(A, "select cq_community_dm($1)", [B]),
      /accepted friends/,
    );
    await as(B, "delete from cq_community_blocks");
    await as(B, "delete from cq_community_friends");
    assert.equal(
      (
        await as(A, "select * from cq_community_messages where room_id=$1", [
          dm,
        ])
      ).rows.length,
      0,
    );
  } finally {
    await db.close();
  }
});
test("class discussions enforce membership, lecturer locks and moderation; reports and reactions cannot expose private data", async () => {
  const { db, as, room } = await setup();
  try {
    const cls = (
      await as(
        A,
        "insert into cq_classes(name,owner_id) values($1,$2) returning id,join_code",
        ["Class test", A],
      )
    ).rows[0];
    const channel = crypto.randomUUID();
    await as(
      A,
      "insert into cq_community_rooms(id,name,kind,class_id) values($1,$2,'class',$3)",
      [channel, "Class discussion", cls.id],
    );
    assert.equal(
      (await as(B, "select * from cq_community_rooms where id=$1", [channel]))
        .rows.length,
      0,
    );
    await as(B, "select cq_join_class($1,$2)", [cls.join_code, "Learner B"]);
    const message = crypto.randomUUID();
    await as(B, "select * from cq_community_send($1,$2,$3,$4,$5)", [
      message,
      channel,
      "Please help",
      "",
      "csharp",
    ]);
    await as(A, "update cq_community_rooms set locked=true where id=$1", [
      channel,
    ]);
    await assert.rejects(
      as(B, "select * from cq_community_send($1,$2,$3,$4,$5)", [
        crypto.randomUUID(),
        channel,
        "Locked send",
        "",
        "csharp",
      ]),
      /read-only/,
    );
    assert.equal(
      (
        await as(
          B,
          "update cq_community_rooms set locked=false where id=$1 returning *",
          [channel],
        )
      ).rows.length,
      0,
    );
    await assert.rejects(
      as(B, "update cq_community_rooms set kind='public'"),
      /permission denied/,
    );
    await assert.rejects(
      as(C, "insert into cq_community_reactions values($1,$2,$3)", [
        message,
        C,
        "👍",
      ]),
      /security/,
    );
    await assert.rejects(
      as(
        C,
        "insert into cq_community_reports(reporter_id,message_id,reason) values($1,$2,$3)",
        [C, message, "cannot access"],
      ),
      /security/,
    );
    await as(
      B,
      "insert into cq_community_reports(reporter_id,message_id,reason) values($1,$2,$3)",
      [B, message, "Please review this content"],
    );
    assert.equal(
      (await as(C, "select * from cq_community_reports")).rows.length,
      0,
    );
    assert.equal(
      (await as(A, "select * from cq_community_reports")).rows.length,
      1,
    );
    await as(A, "update cq_community_reports set status='resolved'");
    assert.equal(
      (
        await as(
          A,
          "delete from cq_community_messages where id=$1 returning *",
          [message],
        )
      ).rows.length,
      1,
    );
  } finally {
    await db.close();
  }
});
test("message rate limits preserve retry acknowledgements; profile opt-in and unread preferences stay private", async () => {
  const { db, as, room } = await setup();
  try {
    const ids = [];
    for (let i = 0; i < 20; i++) {
      const id = crypto.randomUUID();
      ids.push(id);
      await as(A, "select * from cq_community_send($1,$2,$3,$4,$5)", [
        id,
        room,
        "Message " + i,
        "",
        "csharp",
      ]);
    }
    await assert.rejects(
      as(A, "select * from cq_community_send($1,$2,$3,$4,$5)", [
        crypto.randomUUID(),
        room,
        "Message 21",
        "",
        "csharp",
      ]),
      /Slow down/,
    );
    await as(A, "select * from cq_community_send($1,$2,$3,$4,$5)", [
      ids[0],
      room,
      "Message 0",
      "",
      "csharp",
    ]);
    assert.equal(
      (await as(B, "select * from cq_community_unread()")).rows[0].unread,
      20,
    );
    await as(
      B,
      "insert into cq_community_prefs(user_id,room_id,read_at) values($1,$2,now())",
      [B, room],
    );
    assert.equal(
      (await as(B, "select * from cq_community_unread()")).rows.length,
      0,
    );
    assert.equal(
      (await as(A, "select * from cq_community_prefs")).rows.length,
      0,
    );
    await as(
      B,
      "update cq_community_profiles set allow_requests=false where user_id=$1",
      [B],
    );
    await assert.rejects(
      as(
        A,
        "insert into cq_community_friends(requester,recipient) values($1,$2)",
        [A, B],
      ),
      /security/,
    );
    await assert.rejects(
      as(A, "select * from cq_private.community_moderators"),
      /permission denied/,
    );
  } finally {
    await db.close();
  }
});

test("site moderators see a reported DM message without gaining access to the rest of the conversation", async () => {
  const { db, as } = await setup();
  try {
    await as(
      A,
      "insert into cq_community_friends(requester,recipient) values($1,$2)",
      [A, B],
    );
    await as(B, "update cq_community_friends set status='accepted'");
    const dm = (await as(A, "select cq_community_dm($1) id", [B])).rows[0].id;
    const reported = crypto.randomUUID(),
      privateMessage = crypto.randomUUID();
    for (const [id, body] of [
      [reported, "Please report this test message"],
      [privateMessage, "Unreported private content"],
    ])
      await as(A, "select * from cq_community_send($1,$2,$3,$4,$5)", [
        id,
        dm,
        body,
        "",
        "csharp",
      ]);
    await as(
      B,
      "insert into cq_community_reports(reporter_id,message_id,reason) values($1,$2,$3)",
      [B, reported, "Test moderation request"],
    );
    await db.exec(
      `reset role;insert into cq_private.community_moderators(user_id) values('${C}')`,
    );
    assert.equal(
      (await as(C, "select * from cq_community_reports")).rows.length,
      1,
    );
    const rows = (
      await as(C, "select * from cq_community_messages where room_id=$1", [dm])
    ).rows;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, reported);
    assert.equal(
      (await as(C, "select * from cq_community_rooms where id=$1", [dm])).rows
        .length,
      0,
    );
    assert.equal(
      (
        await as(
          C,
          "delete from cq_community_messages where id=$1 returning *",
          [privateMessage],
        )
      ).rows.length,
      0,
    );
    assert.equal(
      (
        await as(
          C,
          "delete from cq_community_messages where id=$1 returning *",
          [reported],
        )
      ).rows.length,
      1,
    );
  } finally {
    await db.close();
  }
});
