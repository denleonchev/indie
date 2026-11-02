create function public.sync_unfinalized_range(
  p_chain_id bigint,
  p_finalized_block bigint,
  p_last_block bigint,
  p_old_block_hash text,
  p_new_block_hash text,
  p_new_block_at timestamptz,
  p_transfers jsonb
)
returns table (deleted_count integer, inserted_count integer)
language plpgsql
set search_path = ''
as $$
begin
  update public.indexer_state
  set last_block_hash = p_new_block_hash, last_block_at = p_new_block_at
  where chain_id = p_chain_id
    and last_block = p_last_block
    and last_block_hash = p_old_block_hash;
  if not found then
    raise exception 'position moved, rollback discarded';
  end if;

  with chain_transfers as (
    select n.tx_hash, n.log_index, n.block_hash
    from jsonb_to_recordset(p_transfers) as n(
      tx_hash text, log_index integer, block_hash text
    )
  )
  delete from public.transfers t
  where t.chain_id = p_chain_id
    and t.block_number > p_finalized_block
    and t.block_number <= p_last_block
    and not exists (
      select 1
      from chain_transfers n
      where n.tx_hash = t.tx_hash
        and n.log_index = t.log_index
        and n.block_hash = t.block_hash
    );
  get diagnostics deleted_count = row_count;

  insert into public.transfers (
    chain_id, tx_hash, log_index, token, from_address, to_address,
    amount, block_number, block_hash, block_time
  )
  select
    p_chain_id, n.tx_hash, n.log_index, n.token, n.from_address, n.to_address,
    n.amount, n.block_number, n.block_hash, n.block_time
  from jsonb_to_recordset(p_transfers) as n(
    tx_hash text, log_index integer, token text, from_address text, to_address text,
    amount numeric, block_number bigint, block_hash text, block_time timestamptz
  )
  on conflict do nothing;
  get diagnostics inserted_count = row_count;

  return next;
end;
$$;

grant delete on table public.transfers to service_role;

revoke execute on function public.sync_unfinalized_range from public, anon, authenticated;
grant execute on function public.sync_unfinalized_range to service_role;
