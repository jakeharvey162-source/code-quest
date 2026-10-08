-- Dedicated CodeQuest project only. No service-role key is needed by the app.
create schema if not exists cq_private;
revoke all on schema cq_private from public;
grant usage on schema cq_private to authenticated;
create table public.cq_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  snapshot jsonb not null check (octet_length(snapshot::text) <= 1048576),
  revision integer not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);
create table public.cq_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  summary jsonb not null check (octet_length(summary::text) <= 2048),
  created_at timestamptz not null default now()
);
create index cq_history_user_created on public.cq_history(user_id, created_at desc);
alter table public.cq_snapshots enable row level security;
alter table public.cq_history enable row level security;
create policy own_snapshots on public.cq_snapshots for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy own_history on public.cq_history for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.cq_snapshots, public.cq_history to authenticated;
revoke all on public.cq_snapshots, public.cq_history from anon;
create function public.cq_save_snapshot(expected_revision integer, payload jsonb, summary jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
declare actor uuid := auth.uid(); saved integer;
begin
  if actor is null then raise exception 'Sign in first'; end if;
  if payload->>'format' is distinct from 'codequest-backup-v1' then raise exception 'Invalid backup'; end if;
  if expected_revision = 0 then
    insert into public.cq_snapshots(user_id, snapshot) values(actor, payload) on conflict do nothing;
  else
    update public.cq_snapshots set snapshot = payload, revision = revision + 1, updated_at = now() where user_id = actor and revision = expected_revision;
  end if;
  get diagnostics saved = row_count;
  if saved = 0 then raise exception 'Cloud save changed on another device. Refresh cloud status, or restore the latest save before saving again.'; end if;
  insert into public.cq_history(user_id, summary) values(actor, summary);
  delete from public.cq_history where user_id = actor and id in (select id from public.cq_history where user_id = actor order by created_at desc offset 100);
end $$;
revoke all on function public.cq_save_snapshot(integer,jsonb,jsonb) from public;
grant execute on function public.cq_save_snapshot(integer,jsonb,jsonb) to authenticated;

create table public.cq_classes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 2 and 80),
  join_code uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now()
);
create index cq_classes_owner on public.cq_classes(owner_id);
create table public.cq_members (
  class_id uuid not null references public.cq_classes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (length(display_name) between 1 and 60),
  completed jsonb not null default '[]'::jsonb check (jsonb_typeof(completed) = 'array' and octet_length(completed::text) < 8192),
  xp integer not null default 0 check (xp between 0 and 100000),
  updated_at timestamptz not null default now(),
  primary key(class_id, user_id)
);
create index cq_members_user on public.cq_members(user_id);
create table public.cq_assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.cq_classes(id) on delete cascade,
  lesson_id text not null check (length(lesson_id) between 1 and 80),
  due_date date,
  created_at timestamptz not null default now(),
  unique(class_id, lesson_id)
);
create index cq_assignments_class on public.cq_assignments(class_id);
create function cq_private.owns_class(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists(select 1 from public.cq_classes where id = target and owner_id = auth.uid());
$$;
create function cq_private.joined_class(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists(select 1 from public.cq_members where class_id = target and user_id = auth.uid());
$$;
revoke all on function cq_private.owns_class(uuid), cq_private.joined_class(uuid) from public;
grant execute on function cq_private.owns_class(uuid), cq_private.joined_class(uuid) to authenticated;
alter table public.cq_classes enable row level security;
alter table public.cq_members enable row level security;
alter table public.cq_assignments enable row level security;
create policy class_read on public.cq_classes for select to authenticated using (owner_id = (select auth.uid()) or cq_private.joined_class(id));
create policy class_create on public.cq_classes for insert to authenticated with check (owner_id = (select auth.uid()));
create policy class_update on public.cq_classes for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy class_delete on public.cq_classes for delete to authenticated using (owner_id = (select auth.uid()));
create policy member_read on public.cq_members for select to authenticated using (user_id = (select auth.uid()) or cq_private.owns_class(class_id));
create policy member_update on public.cq_members for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and cq_private.joined_class(class_id));
create policy member_delete on public.cq_members for delete to authenticated using (user_id = (select auth.uid()) or cq_private.owns_class(class_id));
create policy assignment_read on public.cq_assignments for select to authenticated using (cq_private.owns_class(class_id) or cq_private.joined_class(class_id));
create policy assignment_create on public.cq_assignments for insert to authenticated with check (cq_private.owns_class(class_id));
create policy assignment_update on public.cq_assignments for update to authenticated using (cq_private.owns_class(class_id)) with check (cq_private.owns_class(class_id));
create policy assignment_delete on public.cq_assignments for delete to authenticated using (cq_private.owns_class(class_id));
grant select, insert, update, delete on public.cq_classes, public.cq_assignments to authenticated;
grant select, delete on public.cq_members to authenticated;
-- Members may update shared progress, never identity or class membership.
grant update(display_name,completed,xp,updated_at) on public.cq_members to authenticated;
revoke all on public.cq_classes, public.cq_members, public.cq_assignments from anon;
create function public.cq_join_class(invitation text, learner_name text) returns uuid language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); target uuid;
begin
  if actor is null then raise exception 'Sign in first'; end if;
  if length(learner_name) not between 1 and 60 then raise exception 'Invalid learner name'; end if;
  select id into target from public.cq_classes where join_code::text = invitation and owner_id <> actor;
  if target is null then raise exception 'Invitation code is invalid, or this is your own class'; end if;
  if (select count(*) from public.cq_members where user_id = actor) >= 20 then raise exception 'You can join up to 20 classes'; end if;
  insert into public.cq_members(class_id,user_id,display_name) values(target,actor,learner_name) on conflict do nothing;
  return target;
end $$;
revoke all on function public.cq_join_class(text,text) from public;
grant execute on function public.cq_join_class(text,text) to authenticated;

-- Atomic limits survive serverless restarts. No client can increase the limits.
create table cq_private.voice_usage (
  bucket text primary key,
  characters integer not null default 0 check (characters >= 0)
);
revoke all on cq_private.voice_usage from public, anon, authenticated;
create function public.cq_reserve_voice(characters integer) returns boolean language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); month_bucket text := 'global:' || to_char(timezone('UTC', now()), 'YYYY-MM'); day_bucket text; total integer;
begin
  if actor is null then raise exception 'Sign in first'; end if;
  if characters is null or characters not between 1 and 800 then raise exception 'Invalid text length'; end if;
  day_bucket := actor::text || ':' || to_char(timezone('UTC',now()), 'YYYY-MM-DD');
  insert into cq_private.voice_usage(bucket) values(month_bucket) on conflict do nothing;
  select voice_usage.characters into total from cq_private.voice_usage where bucket = month_bucket for update;
  if total + characters > 8000 then return false; end if;
  insert into cq_private.voice_usage(bucket) values(day_bucket) on conflict do nothing;
  select voice_usage.characters into total from cq_private.voice_usage where bucket = day_bucket for update;
  if total + characters > 1600 then return false; end if;
  update cq_private.voice_usage set characters = voice_usage.characters + cq_reserve_voice.characters where bucket in (month_bucket,day_bucket);
  return true;
end $$;
revoke all on function public.cq_reserve_voice(integer) from public;
grant execute on function public.cq_reserve_voice(integer) to authenticated;
