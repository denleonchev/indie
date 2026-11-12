# Final block was replaced

The indexer stops with `Final block N was replaced: stored X, chain has Y`.
It changes nothing and fails the same way every minute until someone acts.

Usual cause: the indexer was down longer than finality (about 13 minutes),
and a reorg replaced blocks it had saved. Other causes: `RPC_URL` points to
another network, or the node returns wrong data. Only the first one is fixed
by the steps below.

## 1. Check the network

```sh
curl -s -X POST "$RPC_URL" -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_chainId"}'
```

The result must match `CHAIN_ID` (Sepolia: `0xaa36a7`). If it does not, fix
the config and stop here.

## 2. Pause the indexer

```sql
update public.indexer_state
set lease_until = now() + interval '1 day'
where chain_id = 11155111;
```

## 3. Pick a start block

Take `S = N - 128`. Get its hash and time from the node:

```sh
curl -s -X POST "$RPC_URL" -H 'content-type: application/json' \
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_getBlockByNumber\",\"params\":[\"$(printf '0x%x' "$S")\",false]}" \
  | jq '.result | {hash, timestamp}'
```

Check that the stored transfers of block `S` are on the same chain:

```sql
select distinct block_hash
from public.transfers
where chain_id = 11155111 and block_number = <S>;
```

The result must be empty or equal to the node hash. If not, move `S` further
back and repeat.

## 4. Roll back and resume

```sql
begin;

delete from public.transfers
where chain_id = 11155111 and block_number > <S>;

update public.indexer_state
set last_block = <S>,
    last_block_hash = '<hash>',
    last_block_at = to_timestamp(<timestamp as a number>),
    lease_until = null
where chain_id = 11155111;

commit;
```

The next pass logs `Read blocks <S + 1>..`, and the error is gone.
