begin;

create extension if not exists pgtap with schema extensions;

select plan(6);

insert into public.tokens (chain_id, address, symbol, decimals)
values (1, '0x1111111111111111111111111111111111111111', 'TEST', 6);

insert into public.indexer_state (chain_id, last_block, last_block_at, last_block_hash)
values (1, 100, now(), '0x' || repeat('0', 64));

set local role service_role;

select lives_ok(
  $$
    select public.save_indexed_range(
      1,
      101,
      110,
      now(),
      jsonb_build_array(
        jsonb_build_object(
          'tx_hash', '0x' || repeat('a', 64),
          'log_index', 0,
          'token', '0x1111111111111111111111111111111111111111',
          'from_address', '0x00000000000000000000000000000000000000a1',
          'to_address', '0x00000000000000000000000000000000000000b2',
          'amount', 5,
          'block_number', 105,
          'block_hash', '0x' || repeat('5', 64),
          'block_time', now()
        )
      ),
      '0x' || repeat('f', 64)
    )
  $$,
  'saves the range right after the position'
);

select throws_ok(
  $$
    select public.save_indexed_range(
      1,
      105,
      120,
      now(),
      '[]'::jsonb,
      '0x' || repeat('e', 64)
    )
  $$,
  'P0001',
  'position moved, range discarded',
  'rejects a range that does not start right after the position'
);

reset role;

select is(
  (select last_block from public.indexer_state where chain_id = 1),
  '110',
  'moves the position to the end of the saved range only'
);

select is(
  (select last_block_hash from public.indexer_state where chain_id = 1),
  '0x' || repeat('f', 64),
  'stores the hash of the last block of the range'
);

select is(
  (select count(*) from public.transfers where chain_id = 1),
  '1',
  'stores the transfers of the saved range only'
);

select is(
  (select amount from public.transfers where chain_id = 1),
  '5',
  'keeps the transfer amount'
);

select * from finish();

rollback;
