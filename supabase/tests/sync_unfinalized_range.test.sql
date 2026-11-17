begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

insert into public.tokens (chain_id, address, symbol, decimals)
values
  (1, '0x1111111111111111111111111111111111111111', 'TEST', 6),
  (2, '0x1111111111111111111111111111111111111111', 'TEST', 6);

insert into public.indexer_state (chain_id, last_block, last_block_at, last_block_hash)
values (1, 110, now() - interval '1 minute', '0x' || repeat('0', 64));

insert into public.transfers (
  chain_id, tx_hash, log_index, token, from_address, to_address,
  amount, block_number, block_hash, block_time
)
select
  chain_id, '0x' || repeat(tx, 64), 0, '0x1111111111111111111111111111111111111111',
  '0x00000000000000000000000000000000000000a1',
  '0x00000000000000000000000000000000000000b2',
  1, block_number, '0x' || repeat(block_hash, 64), now()
from (
  values
    (1, 'a', 104, '4'),
    (1, 'b', 107, '7'),
    (1, 'c', 108, '8'),
    (1, 'd', 109, '9'),
    (1, '2', 111, '1'),
    (2, '1', 108, '8')
) as stored(chain_id, tx, block_number, block_hash);

create temporary table chain_transfers as
select
  '0x' || repeat(tx, 64) as tx_hash,
  0 as log_index,
  '0x1111111111111111111111111111111111111111' as token,
  '0x00000000000000000000000000000000000000a1' as from_address,
  '0x00000000000000000000000000000000000000b2' as to_address,
  1 as amount,
  block_number,
  '0x' || repeat(block_hash, 64) as block_hash,
  now() as block_time
from (
  values
    ('b', 107, '7'),
    ('d', 110, 'f'),
    ('e', 110, 'f')
) as chain(tx, block_number, block_hash);

grant select on chain_transfers to service_role;

set local role service_role;

select results_eq(
  $$
    select deleted_count, inserted_count
    from public.sync_unfinalized_range(
      1,
      105,
      110,
      '0x' || repeat('0', 64),
      '0x' || repeat('f', 64),
      now(),
      (select jsonb_agg(to_jsonb(t)) from chain_transfers t)
    )
  $$,
  $$ values (2, 2) $$,
  'deletes the replaced transfers and inserts the new ones'
);

reset role;

select is(
  (select last_block_hash from public.indexer_state where chain_id = 1),
  '0x' || repeat('f', 64),
  'stores the new hash of the position block'
);

select is(
  (select last_block from public.indexer_state where chain_id = 1),
  '110',
  'keeps the position block number'
);

select ok(
  exists (select 1 from public.transfers where chain_id = 1 and tx_hash = '0x' || repeat('a', 64)),
  'keeps a final transfer that the chain list does not have'
);

select ok(
  exists (select 1 from public.transfers where chain_id = 1 and tx_hash = '0x' || repeat('b', 64)),
  'keeps a transfer that is still in the same block'
);

select ok(
  not exists (select 1 from public.transfers where chain_id = 1 and tx_hash = '0x' || repeat('c', 64)),
  'deletes a transfer that left the chain'
);

select is(
  (select block_hash from public.transfers where chain_id = 1 and tx_hash = '0x' || repeat('d', 64)),
  '0x' || repeat('f', 64),
  'moves a transfer that went to another block'
);

select ok(
  exists (select 1 from public.transfers where chain_id = 1 and tx_hash = '0x' || repeat('e', 64)),
  'inserts a transfer that is new in the chain'
);

select ok(
  exists (select 1 from public.transfers where chain_id = 1 and tx_hash = '0x' || repeat('2', 64)),
  'keeps a transfer above the position block'
);

select ok(
  exists (select 1 from public.transfers where chain_id = 2 and tx_hash = '0x' || repeat('1', 64)),
  'keeps a transfer of another chain'
);

set local role service_role;

select throws_ok(
  $$
    select public.sync_unfinalized_range(
      1,
      105,
      110,
      '0x' || repeat('0', 64),
      '0x' || repeat('d', 64),
      now(),
      '[]'::jsonb
    )
  $$,
  'P0001',
  'position moved, rollback discarded',
  'rejects a rollback when the position hash has changed'
);

reset role;

select is(
  (select last_block_hash from public.indexer_state where chain_id = 1),
  '0x' || repeat('f', 64),
  'leaves the position as it was after a rejected rollback'
);

select * from finish();

rollback;
