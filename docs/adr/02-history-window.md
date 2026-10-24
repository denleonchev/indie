# 02. History window

## Context

The indexer reads every `Transfer` of the listed tokens, so the stored data
grows with the activity of all holders, not only of our users. USDC on Sepolia
makes about 16,000 transfers a day. At about 400 bytes a row with indexes, that
is about 180 MB a month. The free database plan holds 500 MB.

Reading a token from the day it was created does not fit, and the free public
node keeps logs for only one or two days.

## Options

**A. Full history of each token.** Every wallet sees its whole history. Costs a
database that grows without limit and a node that keeps all logs.

**B. A window of recent days.** Start at the current block and keep the last N
days. The size stays flat, and any node can follow the head of the chain.
Costs: a wallet sees only recent history.

**C. Index by wallet.** Read only the transfers of signed-in wallets, with a
backfill for each new one. The size grows with our users only. Costs a sign-in
before any data exists, one catch-up per wallet over millions of blocks, and a
node that keeps all logs.

## Decision

Option B, with a window of 30 days.

- **The window lives in a settings table,** so a change needs no migration or
  deploy.
- **A daily `pg_cron` job deletes older transfers** with plain SQL. Old cron run
  records are deleted the same way.
- **The cleanup works by time, never by size.** A `delete` does not shrink the
  table files, so a job that deletes until the database gets smaller would
  delete everything.
- **Full history for signed-in wallets (option C) is optional,** for later.
- **If the volume grows,** the next step is daily partitions dropped as a whole.
