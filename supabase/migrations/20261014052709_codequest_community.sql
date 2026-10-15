-- Additive Community module. Existing learning/auth tables and policies are unchanged.
create schema if not exists cq_private;
revoke all on schema cq_private from public;
grant usage on schema cq_private to authenticated;
create table public.cq_community_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 nickname text not null check(length(btrim(nickname)) between 2 and 32),
 avatar text not null default '🤖' check(length(avatar)<=16),
 interests text not null default '' check(length(interests)<=240),
 xp integer not null default 0 check(xp between 0 and 1000000),
 completed integer not null default 0 check(completed between 0 and 1000),
 allow_requests boolean not null default false,
 show_presence boolean not null default false,
 last_seen timestamptz not null default now()
);
create table public.cq_community_blocks (
 owner_id uuid not null references auth.users(id) on delete cascade,
 peer_id uuid not null references auth.users(id) on delete cascade,
 primary key(owner_id,peer_id),check(owner_id<>peer_id)
);
create index cq_community_blocks_peer on public.cq_community_blocks(peer_id);
create table public.cq_community_friends (
 requester uuid not null references public.cq_community_profiles(user_id) on delete cascade,
 recipient uuid not null references public.cq_community_profiles(user_id) on delete cascade,
 status text not null default 'pending' check(status in ('pending','accepted')),
 created_at timestamptz not null default now(),
 primary key(requester,recipient),check(requester<>recipient)
);
create unique index cq_community_friend_pair on public.cq_community_friends(least(requester,recipient),greatest(requester,recipient));
create index cq_community_friends_recipient on public.cq_community_friends(recipient,status);
-- Administrator grants are provisioned only through reviewed SQL, never user_metadata.
create table cq_private.community_moderators(user_id uuid primary key references auth.users(id) on delete cascade);
revoke all on cq_private.community_moderators from public,anon,authenticated;
create table public.cq_community_rooms (
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(btrim(name)) between 2 and 80),
 kind text not null check(kind in ('public','dm','class')),
 slug text unique,
 class_id uuid unique references public.cq_classes(id) on delete cascade,
 member_a uuid references auth.users(id) on delete cascade,
 member_b uuid references auth.users(id) on delete cascade,
 locked boolean not null default false,
 unique(member_a,member_b),
 check((kind='public' and slug is not null and class_id is null and member_a is null and member_b is null)
 or (kind='class' and slug is null and class_id is not null and member_a is null and member_b is null)
 or (kind='dm' and slug is null and class_id is null and member_a is not null and member_b is not null and member_a<member_b))
);
create index cq_community_rooms_b on public.cq_community_rooms(member_b);
insert into public.cq_community_rooms(name,kind,slug) values
 ('General programming','public','general'),('C# workshop','public','csharp'),('Python lab','public','python'),('JavaScript studio','public','javascript'),('Help desk','public','help');
create table public.cq_community_messages (
 id uuid primary key,
 room_id uuid not null references public.cq_community_rooms(id) on delete cascade,
 sender_id uuid not null references public.cq_community_profiles(user_id) on delete cascade,
 body text not null default '' check(length(body)<=4000),
 code text not null default '' check(length(code)<=12000),
 language text not null default 'csharp' check(language in ('csharp','python','python-turtle','javascript','typescript','html','css')),
 challenge_id text check(challenge_id in ('bill-total','age-gate','student-id','sum-positive','safe-amount','loan-payment','atm-balance')),
 created_at timestamptz not null default now(),
 check(length(btrim(body))>0 or length(btrim(code))>0 or challenge_id is not null)
);
create index cq_community_messages_room_cursor on public.cq_community_messages(room_id,created_at desc,id desc);
create index cq_community_messages_sender_recent on public.cq_community_messages(sender_id,created_at desc);
create table public.cq_community_reactions (
 message_id uuid not null references public.cq_community_messages(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 emoji text not null check(emoji in ('👍','💡','🎉')),
 primary key(message_id,user_id,emoji)
);
create index cq_community_reactions_user on public.cq_community_reactions(user_id);
create table public.cq_community_prefs (
 user_id uuid not null references auth.users(id) on delete cascade,
 room_id uuid not null references public.cq_community_rooms(id) on delete cascade,
 read_at timestamptz not null default 'epoch',muted boolean not null default false,
 primary key(user_id,room_id)
);
create index cq_community_prefs_room on public.cq_community_prefs(room_id);
create table public.cq_community_reports (
 id uuid primary key default gen_random_uuid(),
 reporter_id uuid not null references auth.users(id) on delete cascade,
 message_id uuid not null references public.cq_community_messages(id) on delete cascade,
 reason text not null check(length(btrim(reason)) between 5 and 500),
 status text not null default 'open' check(status in ('open','resolved')),
 created_at timestamptz not null default now(),unique(reporter_id,message_id)
);
create index cq_community_reports_message on public.cq_community_reports(message_id);

-- These narrowly scoped internal lookups avoid RLS recursion. None accept an actor ID.
create function cq_private.community_blocked(peer uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.cq_community_blocks where (owner_id=auth.uid() and peer_id=peer) or (owner_id=peer and peer_id=auth.uid()));
$$;
create function cq_private.community_friend(peer uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and not cq_private.community_blocked(peer) and exists(select 1 from public.cq_community_friends where status='accepted' and ((requester=auth.uid() and recipient=peer) or (requester=peer and recipient=auth.uid())));
$$;
create function cq_private.community_moderator() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from cq_private.community_moderators where user_id=auth.uid());
$$;
create function cq_private.community_room(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.cq_community_rooms r where r.id=target and (
 r.kind='public' or (r.kind='class' and (cq_private.owns_class(r.class_id) or cq_private.joined_class(r.class_id))) or
 (r.kind='dm' and (auth.uid()=r.member_a or auth.uid()=r.member_b) and cq_private.community_friend(case when r.member_a=auth.uid() then r.member_b else r.member_a end))));
$$;
create function cq_private.community_manage(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (cq_private.community_moderator() or exists(select 1 from public.cq_community_rooms where id=target and kind='class' and cq_private.owns_class(class_id)));
$$;
create function cq_private.community_message(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.cq_community_messages where id=target and cq_private.community_room(room_id) and not cq_private.community_blocked(sender_id));
$$;
-- Site moderators may review only the specific reported message in a private conversation.
create function cq_private.community_reported(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and cq_private.community_moderator() and exists(select 1 from public.cq_community_reports where message_id=target);
$$;
revoke all on function cq_private.community_reported(uuid) from public,anon;
grant execute on function cq_private.community_reported(uuid) to authenticated;
revoke all on function cq_private.community_blocked(uuid),cq_private.community_friend(uuid),cq_private.community_moderator(),cq_private.community_room(uuid),cq_private.community_manage(uuid),cq_private.community_message(uuid) from public,anon;
grant execute on function cq_private.community_blocked(uuid),cq_private.community_friend(uuid),cq_private.community_moderator(),cq_private.community_room(uuid),cq_private.community_manage(uuid),cq_private.community_message(uuid) to authenticated;

alter table public.cq_community_profiles enable row level security;
alter table public.cq_community_blocks enable row level security;
alter table public.cq_community_friends enable row level security;
alter table public.cq_community_rooms enable row level security;
alter table public.cq_community_messages enable row level security;
alter table public.cq_community_reactions enable row level security;
alter table public.cq_community_prefs enable row level security;
alter table public.cq_community_reports enable row level security;
create policy community_profile_read on public.cq_community_profiles for select to authenticated using (not cq_private.community_blocked(user_id));
create policy community_profile_insert on public.cq_community_profiles for insert to authenticated with check(user_id=(select auth.uid()));
create policy community_profile_update on public.cq_community_profiles for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy community_profile_delete on public.cq_community_profiles for delete to authenticated using(user_id=(select auth.uid()));
create policy community_block_own on public.cq_community_blocks for all to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy community_friend_read on public.cq_community_friends for select to authenticated using((requester=(select auth.uid()) or recipient=(select auth.uid())) and not cq_private.community_blocked(case when requester=(select auth.uid()) then recipient else requester end));
create policy community_friend_request on public.cq_community_friends for insert to authenticated with check(requester=(select auth.uid()) and status='pending' and not cq_private.community_blocked(recipient) and exists(select 1 from public.cq_community_profiles where user_id=recipient and allow_requests));
create policy community_friend_accept on public.cq_community_friends for update to authenticated using(recipient=(select auth.uid()) and not cq_private.community_blocked(requester)) with check(recipient=(select auth.uid()) and status='accepted' and not cq_private.community_blocked(requester));
create policy community_friend_remove on public.cq_community_friends for delete to authenticated using(requester=(select auth.uid()) or recipient=(select auth.uid()));
create policy community_room_read on public.cq_community_rooms for select to authenticated using(kind='public' or (kind='class' and (cq_private.owns_class(class_id) or cq_private.joined_class(class_id))) or (kind='dm' and ((member_a=(select auth.uid()) and cq_private.community_friend(member_b)) or (member_b=(select auth.uid()) and cq_private.community_friend(member_a)))));
create policy community_room_create on public.cq_community_rooms for insert to authenticated with check(
 (kind='class' and cq_private.owns_class(class_id) and not locked) or
 (kind='dm' and not locked and ((member_a=(select auth.uid()) and cq_private.community_friend(member_b)) or (member_b=(select auth.uid()) and cq_private.community_friend(member_a)))));
create policy community_room_lock on public.cq_community_rooms for update to authenticated using(cq_private.community_manage(id)) with check(cq_private.community_manage(id));
create policy community_message_read on public.cq_community_messages for select to authenticated using((cq_private.community_room(room_id) and not cq_private.community_blocked(sender_id)) or cq_private.community_reported(id));
create policy community_message_create on public.cq_community_messages for insert to authenticated with check(sender_id=(select auth.uid()) and cq_private.community_room(room_id));
create policy community_message_remove on public.cq_community_messages for delete to authenticated using((cq_private.community_room(room_id) and (sender_id=(select auth.uid()) or cq_private.community_manage(room_id))) or cq_private.community_reported(id));
create policy community_reaction_read on public.cq_community_reactions for select to authenticated using(cq_private.community_message(message_id) and not cq_private.community_blocked(user_id));
create policy community_reaction_add on public.cq_community_reactions for insert to authenticated with check(user_id=(select auth.uid()) and cq_private.community_message(message_id));
create policy community_reaction_remove on public.cq_community_reactions for delete to authenticated using(user_id=(select auth.uid()));
create policy community_prefs_own on public.cq_community_prefs for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and cq_private.community_room(room_id));
create policy community_report_create on public.cq_community_reports for insert to authenticated with check(reporter_id=(select auth.uid()) and status='open' and cq_private.community_message(message_id));
create policy community_report_read on public.cq_community_reports for select to authenticated using(reporter_id=(select auth.uid()) or exists(select 1 from public.cq_community_messages m where m.id=message_id and cq_private.community_manage(m.room_id)));
create policy community_report_resolve on public.cq_community_reports for update to authenticated using(exists(select 1 from public.cq_community_messages m where m.id=message_id and cq_private.community_manage(m.room_id))) with check(status='resolved' and exists(select 1 from public.cq_community_messages m where m.id=message_id and cq_private.community_manage(m.room_id)));
revoke all on public.cq_community_profiles,public.cq_community_blocks,public.cq_community_friends,public.cq_community_rooms,public.cq_community_messages,public.cq_community_reactions,public.cq_community_prefs,public.cq_community_reports from anon,authenticated;
grant select,insert,delete on public.cq_community_profiles,public.cq_community_blocks,public.cq_community_friends,public.cq_community_reactions,public.cq_community_prefs to authenticated;
grant update(user_id,nickname,avatar,interests,xp,completed,allow_requests,show_presence) on public.cq_community_profiles to authenticated;
grant update(status) on public.cq_community_friends to authenticated;
grant update on public.cq_community_prefs to authenticated;
grant select on public.cq_community_rooms,public.cq_community_messages,public.cq_community_reports to authenticated;
grant insert(id,name,kind,class_id,member_a,member_b) on public.cq_community_rooms to authenticated;
grant update(locked) on public.cq_community_rooms to authenticated;
grant insert(id,room_id,sender_id,body,code,language,challenge_id),delete on public.cq_community_messages to authenticated;
grant insert(reporter_id,message_id,reason) on public.cq_community_reports to authenticated;
grant update(status) on public.cq_community_reports to authenticated;

create function cq_private.community_profile_stamp() returns trigger language plpgsql set search_path='' as $$
begin new.last_seen=now();return new;end;
$$;
create trigger cq_community_profile_stamp before insert or update on public.cq_community_profiles for each row execute function cq_private.community_profile_stamp();
create function cq_private.community_message_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare prior public.cq_community_messages;
begin
 if auth.uid() is null or new.sender_id<>auth.uid() or not cq_private.community_room(new.room_id) then raise exception 'This conversation is unavailable.' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,724));
 select * into prior from public.cq_community_messages where id=new.id;
 if found then
   if prior.sender_id=new.sender_id and prior.room_id=new.room_id and prior.body=new.body and prior.code=new.code and prior.language=new.language and prior.challenge_id is not distinct from new.challenge_id then return null;end if;
   raise exception 'Message identifier is already in use.' using errcode='23514';
 end if;
 if exists(select 1 from public.cq_community_rooms where id=new.room_id and locked) and not cq_private.community_manage(new.room_id) then raise exception 'This channel is read-only.' using errcode='42501';end if;
 if (select count(*) from (select 1 from public.cq_community_messages where sender_id=auth.uid() and created_at>now()-interval '1 minute' limit 20) recent)>=20 then raise exception 'Slow down: try sending again in a minute.' using errcode='42900';end if;
 new.created_at=now();return new;
end;
$$;
create trigger cq_community_message_guard before insert on public.cq_community_messages for each row execute function cq_private.community_message_guard();
revoke all on function cq_private.community_profile_stamp(),cq_private.community_message_guard() from public,anon,authenticated;
-- Invoker RPCs keep normal RLS. Replays acknowledge the existing stable UUID.
create function public.cq_community_send(client_id uuid,target_room uuid,message_body text,message_code text,code_language text,challenge text default null)
returns setof public.cq_community_messages language plpgsql security invoker set search_path='' as $$
begin
 insert into public.cq_community_messages(id,room_id,sender_id,body,code,language,challenge_id) values(client_id,target_room,auth.uid(),message_body,message_code,code_language,challenge) on conflict(id) do nothing;
 return query select * from public.cq_community_messages where id=client_id and sender_id=auth.uid();
end;
$$;
create function public.cq_community_dm(peer uuid) returns uuid language plpgsql security invoker set search_path='' as $$
declare target uuid; a uuid:=least(auth.uid(),peer);b uuid:=greatest(auth.uid(),peer);
begin
 if auth.uid() is null or peer=auth.uid() or not cq_private.community_friend(peer) then raise exception 'Private messages are for accepted friends. Check your friendship and block settings.' using errcode='42501';end if;
 insert into public.cq_community_rooms(id,name,kind,member_a,member_b) values(gen_random_uuid(),'Private conversation','dm',a,b) on conflict(member_a,member_b) do nothing;
 select id into target from public.cq_community_rooms where member_a=a and member_b=b;return target;
end;
$$;
create function public.cq_community_unread() returns table(room_id uuid,unread bigint) language sql stable security invoker set search_path='' as $$
 select m.room_id,count(*) from public.cq_community_messages m left join public.cq_community_prefs p on p.room_id=m.room_id and p.user_id=auth.uid()
 where m.sender_id<>auth.uid() and not coalesce(p.muted,false) and m.created_at>coalesce(p.read_at,'epoch'::timestamptz) group by m.room_id;
$$;
revoke all on function public.cq_community_send(uuid,uuid,text,text,text,text),public.cq_community_dm(uuid),public.cq_community_unread() from public,anon;
grant execute on function public.cq_community_send(uuid,uuid,text,text,text,text),public.cq_community_dm(uuid),public.cq_community_unread() to authenticated;
-- Keep DELETE payloads to primary keys. Clients re-fetch authorized rows on changes.
do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
  alter publication supabase_realtime add table public.cq_community_messages,public.cq_community_friends,public.cq_community_reactions,public.cq_community_rooms;
 end if;
end $$;
create function public.cq_community_is_moderator() returns boolean language sql stable security invoker set search_path='' as $$select cq_private.community_moderator();$$;
revoke all on function public.cq_community_is_moderator() from public,anon;
grant execute on function public.cq_community_is_moderator() to authenticated;

create index cq_community_profiles_nickname on public.cq_community_profiles(nickname,user_id);
