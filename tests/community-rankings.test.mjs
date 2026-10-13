import test from 'node:test';import assert from 'node:assert/strict';import {PGlite} from '@electric-sql/pglite';import {readFile} from 'node:fs/promises';
test('all public students receive an overall rank, stable tie position, and private rows stay hidden',async()=>{const db=new PGlite();try{
 await db.exec("create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;");
 for(const file of ['20261013173340_learner_profiles_leaderboard.sql','20261013193631_community_rankings.sql'])await db.exec(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'));
 for(let i=0;i<105;i++){const id='90000000-0000-4000-8000-'+String(i).padStart(12,'0');await db.query('insert into auth.users values($1)',[id]);await db.query('insert into cq_leaderboard(user_id,nickname,xp,visible) values($1,$2,$3,true)',[id,'Student '+i,Math.floor((105-i)/2)*10]);}
 const privateId='80000000-0000-4000-8000-000000000000';await db.query('insert into auth.users values($1)',[privateId]);await db.query("insert into cq_leaderboard(user_id,nickname,xp,visible) values($1,'Private',99999,false)",[privateId]);
 await db.exec('set role anon');assert.equal((await db.query('select count(*)::int as n from cq_rankings')).rows[0].n,105);
 const tail=(await db.query('select * from cq_rankings order by position limit 25 offset 100')).rows;assert.equal(tail.length,5);assert.equal(Number(tail[0].position),101);
 const mine=(await db.query('select * from cq_rankings where position=67')).rows[0];assert.equal(Number(mine.position),67);assert.ok(Number(mine.rank)>50);assert.ok(mine.xp_ahead>=mine.xp);assert.equal((await db.query('select * from cq_rankings where user_id=$1',[privateId])).rows.length,0);
 }finally{await db.close()}});
