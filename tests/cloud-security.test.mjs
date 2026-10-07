import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const A = "11111111-1111-4111-8111-111111111111",
  B = "22222222-2222-4222-8222-222222222222",
  C = "33333333-3333-4333-8333-333333333333";
test("Postgres policies isolate private saves, enforce lecturer ownership and cap voice use", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create role authenticated; create role anon; create schema auth; create table auth.users(id uuid primary key); insert into auth.users values('${A}'),('${B}'),('${C}'); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`,
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
    const as = async (id, query, params = []) => {
      await db.exec(
        `reset role; set role authenticated; set request.jwt.claim.sub = '${id}';`,
      );
      return db.query(query, params);
    };
    const payload = {
      format: "codequest-backup-v1",
      progress: { completed: ["variables"] },
    };
    await as(A, "select public.cq_save_snapshot(0,$1,$2)", [
      payload,
      { xp: 100, completed: 1 },
    ]);
    assert.equal(
      (await as(B, "select * from public.cq_snapshots")).rows.length,
      0,
    );
    assert.equal(
      (await as(B, "select * from public.cq_history")).rows.length,
      0,
    );
    await assert.rejects(
      as(B, "insert into public.cq_snapshots(user_id,snapshot) values($1,$2)", [
        A,
        payload,
      ]),
      /row-level security/,
    );
    await assert.rejects(
      as(A, "select public.cq_save_snapshot(0,$1,$2)", [payload, {}]),
      /changed on another device/,
    );
    await as(A, "select public.cq_save_snapshot(1,$1,$2)", [payload, {}]);
    assert.equal(
      (await as(A, "select revision from public.cq_snapshots")).rows[0]
        .revision,
      2,
    );
    assert.equal(
      (await as(A, "select * from public.cq_history")).rows.length,
      2,
    );
    const classroom = (
      await as(
        A,
        "insert into public.cq_classes(owner_id,name) values($1,$2) returning id,join_code",
        [A, "Grade 12"],
      )
    ).rows[0];
    assert.equal(
      (await as(B, "select * from public.cq_classes")).rows.length,
      0,
    );
    await assert.rejects(
      as(B, "insert into public.cq_classes(owner_id,name) values($1,$2)", [
        A,
        "Spoof",
      ]),
      /row-level security/,
    );
    await assert.rejects(
      as(
        B,
        "insert into public.cq_members(class_id,user_id,display_name) values($1,$2,$3)",
        [classroom.id, C, "Spoof"],
      ),
      /permission denied/,
    );
    await assert.rejects(
      as(B, "select public.cq_join_class($1,$2)", ["not-a-code", "Learner"]),
      /invalid/,
    );
    await as(B, "select public.cq_join_class($1,$2)", [
      classroom.join_code,
      "Learner B",
    ]);
    await as(C, "select public.cq_join_class($1,$2)", [
      classroom.join_code,
      "Learner C",
    ]);
    assert.equal(
      (await as(B, "select * from public.cq_classes")).rows.length,
      1,
    );
    assert.equal(
      (await as(B, "select * from public.cq_members")).rows.length,
      1,
    );
    await assert.rejects(
      as(B, "update public.cq_members set user_id=$1", [C]),
      /permission denied/,
    );
    await as(
      B,
      "update public.cq_members set completed=$1,xp=100 where class_id=$2",
      [["variables"], classroom.id],
    );
    assert.equal(
      (await as(A, "select * from public.cq_members")).rows.length,
      2,
    );
    assert.equal(
      (await as(A, "select * from public.cq_snapshots where user_id=$1", [B]))
        .rows.length,
      0,
    );
    await as(
      A,
      "insert into public.cq_assignments(class_id,lesson_id) values($1,$2)",
      [classroom.id, "variables"],
    );
    assert.equal(
      (await as(B, "select * from public.cq_assignments")).rows.length,
      1,
    );
    await assert.rejects(
      as(
        B,
        "insert into public.cq_assignments(class_id,lesson_id) values($1,$2)",
        [classroom.id, "loops"],
      ),
      /row-level security/,
    );
    await as(B, "delete from public.cq_members where class_id=$1", [
      classroom.id,
    ]);
    assert.equal(
      (await as(B, "select * from public.cq_assignments")).rows.length,
      0,
    );
    assert.equal(
      (await as(A, "select * from public.cq_members")).rows.length,
      1,
    );
    assert.equal(
      (await as(A, "select public.cq_reserve_voice(800) as allowed")).rows[0]
        .allowed,
      true,
    );
    assert.equal(
      (await as(A, "select public.cq_reserve_voice(800) as allowed")).rows[0]
        .allowed,
      true,
    );
    assert.equal(
      (await as(A, "select public.cq_reserve_voice(1) as allowed")).rows[0]
        .allowed,
      false,
    );
    await assert.rejects(
      as(B, "select * from cq_private.voice_usage"),
      /permission denied/,
    );
    await assert.rejects(
      as(B, "select public.cq_reserve_voice(801)"),
      /Invalid text length/,
    );
    await db.exec("reset role; set role anon; set request.jwt.claim.sub = '';");
    await assert.rejects(
      db.query("select public.cq_join_class($1,$2)", [
        classroom.join_code,
        "Anonymous",
      ]),
      /permission denied/,
    );
  } finally {
    await db.close();
  }
});
