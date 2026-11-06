create function public.signal_export_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.send(
    jsonb_build_object('export_id', new.id, 'status', new.status),
    'changed',
    'exports:' || new.wallet,
    true
  );
  return null;
end;
$$;

revoke execute on function public.signal_export_status_change from public, anon, authenticated;

create trigger signal_export_status_change
  after update of status on public.exports
  for each row
  when (old.status is distinct from new.status)
  execute function public.signal_export_status_change();

create policy "Users can listen to own export signals"
  on realtime.messages for select
  to authenticated
  using (
    realtime.topic() = 'exports:' || (select auth.jwt() ->> 'wallet')
    and extension = 'broadcast'
  );
