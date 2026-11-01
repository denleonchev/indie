# 04. Reorg handling

## Context

Recent blocks can be replaced until the network marks them `finalized`, usually
after about 13 minutes. Each block holds the hash of its parent, so a change in
any block changes the hash of every block above it.

## Options

**A. A table of block hashes.** Finds the exact fork. Costs a new table and a
request for almost every new block.

**B. One hash at the position.** On a mismatch, read the logs of all non-final
blocks and compare them with stored transfers. Costs a wider read on each
rollback: 4,170 logs and about 200 ms for mainnet USDC.

## Decision

Option B. The indexer reads up to `head - CONFIRMATIONS`, a setting that trades
delay for the risk of a rollback. Records have no status, so production needs a
value above the usual reorg depth, and users see only confirmed transfers.

- **Each pass compares the position hash with the chain** before it reads.
- **A rollback covers the blocks above the `finalized` tag,** not a fixed 64
  blocks, because finality has no fixed number of blocks.
- **Only rows that differ are replaced,** in one transaction with the position.
- **A mismatch at or below `finalized` stops the pass** and changes nothing.
- **Move to option A** if the non-final logs often reach
  `MAX_TRANSFERS_PER_PASS`, or the service keeps derived data such as balances.
