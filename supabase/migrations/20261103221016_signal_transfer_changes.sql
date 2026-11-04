create function public.signal_transfer_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_from_block bigint;
  v_to_block bigint;
begin
  select min(block_number), max(block_number)
  into v_from_block, v_to_block
  from changed_rows;

  if v_from_block is not null then
    perform realtime.send(
      jsonb_build_object(
        'operation', tg_op,
        'from_block', v_from_block,
        'to_block', v_to_block
      ),
      'changed',
      'transfers',
      true
    );
  end if;

  return null;
end;
$$;

revoke execute on function public.signal_transfer_changes from public, anon, authenticated;

create trigger signal_inserted_transfers
  after insert on public.transfers
  referencing new table as changed_rows
  for each statement
  execute function public.signal_transfer_changes();

create trigger signal_deleted_transfers
  after delete on public.transfers
  referencing old table as changed_rows
  for each statement
  execute function public.signal_transfer_changes();

create policy "Anyone can listen to transfer signals"
  on realtime.messages for select
  to anon, authenticated
  using (realtime.topic() = 'transfers' and extension = 'broadcast');
