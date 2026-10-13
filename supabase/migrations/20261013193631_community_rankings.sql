-- Rank every public participant; filtering a player's row happens after ranking.
create view public.cq_rankings with (security_invoker = true) as
select user_id,nickname,avatar,xp,completed,
       rank() over (order by xp desc,completed desc) as rank,
       row_number() over(order by xp desc,completed desc,user_id) as position,
       lag(xp) over(order by xp desc,completed desc,user_id) as xp_ahead
from public.cq_leaderboard where visible;
revoke all on public.cq_rankings from anon,authenticated;
grant select on public.cq_rankings to anon,authenticated;
