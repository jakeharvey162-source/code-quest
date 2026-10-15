-- Do not retain or expose an activity timestamp for learners who hide presence.
-- RLS alone filters rows, not individual columns on an otherwise public profile.
alter table public.cq_community_profiles alter column last_seen drop not null;
alter table public.cq_community_profiles alter column last_seen drop default;
create or replace function cq_private.community_profile_stamp()
returns trigger language plpgsql set search_path='' as $$
begin
 new.last_seen=case when new.show_presence then now() else null end;
 return new;
end;
$$;
update public.cq_community_profiles set last_seen=null where not show_presence;
revoke all on function cq_private.community_profile_stamp() from public,anon,authenticated;
