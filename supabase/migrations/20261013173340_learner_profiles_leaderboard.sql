-- Apply only to the dedicated CodeQuest project after the account migration.
create table public.cq_leaderboard (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (length(trim(nickname)) between 1 and 60),
  avatar text not null default '🤖' check (octet_length(avatar) <= 24000 and (avatar in ('🤖','🦁','🚀','🧑🏾‍💻','🦉','🐉','') or avatar ~ '^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$')),
  xp integer not null default 0 check (xp between 0 and 100000),
  completed integer not null default 0 check (completed between 0 and 21),
  visible boolean not null default false
);
alter table public.cq_leaderboard enable row level security;
revoke all on public.cq_leaderboard from anon, authenticated;
grant select on public.cq_leaderboard to anon, authenticated;
grant insert, update, delete on public.cq_leaderboard to authenticated;
create policy published_scores on public.cq_leaderboard for select to anon, authenticated using (visible);
create policy own_score_read on public.cq_leaderboard for select to authenticated using ((select auth.uid()) = user_id);
create policy own_score_insert on public.cq_leaderboard for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_score_update on public.cq_leaderboard for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy own_score_delete on public.cq_leaderboard for delete to authenticated using ((select auth.uid()) = user_id);
create index cq_leaderboard_ranking on public.cq_leaderboard (xp desc, completed desc, user_id) where visible;
