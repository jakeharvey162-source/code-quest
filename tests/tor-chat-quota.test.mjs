import test from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
test("Tor quota survives clients, is private, and limits per-minute and daily requests", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      "create role anon;create role authenticated;create schema auth;create schema cq_private;create table auth.users(id uuid primary key);insert into auth.users values('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;",
    );
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/20261015185000_codequest_tor_chat_limits.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    await db.exec(
      "set role authenticated;set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';",
    );
    for (let i = 0; i < 8; i++)
      assert.equal(
        (await db.query("select cq_reserve_tor_chat() as allowed")).rows[0]
          .allowed,
        true,
      );
    assert.equal(
      (await db.query("select cq_reserve_tor_chat() as allowed")).rows[0]
        .allowed,
      false,
    );
    await assert.rejects(
      db.query("select * from cq_private.tor_chat_limits"),
      /permission denied/,
    );
    await db.exec(
      "set request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';",
    );
    assert.equal(
      (await db.query("select cq_reserve_tor_chat() as allowed")).rows[0]
        .allowed,
      true,
    );
    await db.exec(
      "reset role;update cq_private.tor_chat_limits set requests=60, minute_start=now()-interval '2 minutes';set role authenticated;",
    );
    assert.equal(
      (await db.query("select cq_reserve_tor_chat() as allowed")).rows[0]
        .allowed,
      false,
    );
  } finally {
    await db.close();
  }
});
