create or replace function public.signal_transfer_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_transfer_count bigint;
  v_from_block bigint;
  v_to_block bigint;
begin
  select count(*), min(block_number), max(block_number)
  into v_transfer_count, v_from_block, v_to_block
  from changed_rows;

  if v_transfer_count > 0 then
    perform realtime.send(
      jsonb_build_object(
        'operation', tg_op,
        'transfer_count', v_transfer_count,
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
