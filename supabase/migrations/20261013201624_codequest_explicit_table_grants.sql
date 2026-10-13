-- Remove inherited shared-project defaults before granting only app-required operations.
revoke all on public.cq_snapshots,public.cq_history,public.cq_classes,public.cq_members,public.cq_assignments from public,anon,authenticated;
grant select,insert,update,delete on public.cq_snapshots,public.cq_history,public.cq_classes,public.cq_assignments to authenticated;
grant select,delete on public.cq_members to authenticated;
grant update(display_name,completed,xp,updated_at) on public.cq_members to authenticated;
revoke all on function cq_private.owns_class(uuid),cq_private.joined_class(uuid) from public,anon;
grant execute on function cq_private.owns_class(uuid),cq_private.joined_class(uuid) to authenticated;
