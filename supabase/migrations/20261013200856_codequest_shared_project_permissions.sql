-- Shared projects can have default role grants. Explicitly restrict CodeQuest RPCs.
revoke all on function public.cq_save_snapshot(integer,jsonb,jsonb), public.cq_join_class(text,text), public.cq_reserve_voice(integer) from public, anon;
grant execute on function public.cq_save_snapshot(integer,jsonb,jsonb), public.cq_join_class(text,text), public.cq_reserve_voice(integer) to authenticated;
