-- Shared-database quotas; requests never reset because a serverless instance restarts.
create table cq_private.tor_chat_limits (
 user_id uuid not null references auth.users(id) on delete cascade,
 day date not null default current_date,
 requests integer not null default 0,
 minute_start timestamptz not null default now(),
 minute_requests integer not null default 0,
 primary key(user_id,day)
);
revoke all on cq_private.tor_chat_limits from public,anon,authenticated;
create function public.cq_reserve_tor_chat() returns boolean language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); allowed boolean;
begin
 if actor is null then return false;end if;
 insert into cq_private.tor_chat_limits(user_id,day,requests,minute_requests) values(actor,current_date,1,1)
 on conflict(user_id,day) do update set
 requests=tor_chat_limits.requests+1,
 minute_requests=case when tor_chat_limits.minute_start<now()-interval '1 minute' then 1 else tor_chat_limits.minute_requests+1 end,
 minute_start=case when tor_chat_limits.minute_start<now()-interval '1 minute' then now() else tor_chat_limits.minute_start end
 where tor_chat_limits.requests<60 and (tor_chat_limits.minute_start<now()-interval '1 minute' or tor_chat_limits.minute_requests<8)
 returning true into allowed;
 delete from cq_private.tor_chat_limits where user_id=actor and day<current_date-2;
 return coalesce(allowed,false);
end;
$$;
revoke all on function public.cq_reserve_tor_chat() from public,anon;
grant execute on function public.cq_reserve_tor_chat() to authenticated;
