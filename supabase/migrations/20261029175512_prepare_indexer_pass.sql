alter table public.indexer_state rename column head_block to last_block;
alter table public.indexer_state rename column head_block_at to last_block_at;
alter table public.indexer_state add column lease_until timestamptz;
delete from public.indexer_state;

create function public.save_pass(
  p_chain_id bigint,
  p_from_block bigint,
  p_to_block bigint,
  p_to_block_at timestamptz,
  p_transfers jsonb
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.indexer_state
  set last_block = p_to_block, last_block_at = p_to_block_at
  where chain_id = p_chain_id and last_block = p_from_block - 1;
  if not found then
    raise exception 'position moved, pass discarded';
  end if;

  insert into public.transfers (
    chain_id, tx_hash, log_index, token, from_address, to_address,
    amount, block_number, block_hash, block_time
  )
  select
    p_chain_id, t.tx_hash, t.log_index, t.token, t.from_address, t.to_address,
    t.amount, t.block_number, t.block_hash, t.block_time
  from jsonb_to_recordset(p_transfers) as t(
    tx_hash text, log_index integer, token text, from_address text, to_address text,
    amount numeric, block_number bigint, block_hash text, block_time timestamptz
  )
  on conflict do nothing;
end;
$$;

revoke execute on function public.save_pass from public, anon, authenticated;
grant execute on function public.save_pass to service_role;
