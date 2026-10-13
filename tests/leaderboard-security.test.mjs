import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const A="11111111-1111-4111-8111-111111111111",B="22222222-2222-4222-8222-222222222222";
test("leaderboard is opt-in, public reads expose only visible rows, and users cannot edit other scores",async()=>{
 const db=new PGlite();
 try{
  await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('${A}'),('${B}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`);
  await db.exec(await readFile(new URL('../supabase/migrations/20261013173340_learner_profiles_leaderboard.sql',import.meta.url),'utf8'));
  async function as(id,sql,params=[]){await db.exec(`reset role;set role ${id?'authenticated':'anon'};set request.jwt.claim.sub='${id||""}';`);return db.query(sql,params);}
  await as(A,"insert into cq_leaderboard(user_id,nickname) values($1,$2)",[A,"Private explorer"]);
  assert.equal((await as(null,"select * from cq_leaderboard")).rows.length,0);
  assert.equal((await as(B,"select * from cq_leaderboard")).rows.length,0);
  await assert.rejects(as(B,"insert into cq_leaderboard(user_id,nickname) values($1,$2)",[A,"Spoof"]),/row-level security/);
  assert.equal((await as(B,"update cq_leaderboard set xp=10000 where user_id=$1 returning *",[A])).rows.length,0);
  await as(A,"update cq_leaderboard set visible=true,xp=120 where user_id=$1",[A]);
  const rows=(await as(null,"select * from cq_leaderboard")).rows;assert.equal(rows[0].xp,120);assert.equal(rows[0].email,undefined);
  await assert.rejects(as(null,"delete from cq_leaderboard"),/permission denied/);
  await assert.rejects(as(A,"update cq_leaderboard set xp=-1"),/check constraint/);
  await as(A,"delete from cq_leaderboard where user_id=$1",[A]);assert.equal((await as(null,"select * from cq_leaderboard")).rows.length,0);
 }finally{await db.close()}
});
