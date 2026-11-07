# 05. Live updates

## Context

An open page must show new and rolled-back transfers without a reload. One
indexer pass can insert thousands of rows. The Free plan allows 100 Realtime
messages per second, and each delivery to each tab counts.

## Options

**A. Postgres Changes.** One event per row. A catch-up breaks the limit, delete
events carry only the primary key under RLS, and amounts arrive as JSON numbers.

**B. A signal per statement.** Triggers send one message per insert or delete,
and the page reloads its data with its usual queries.

## Decision

Option B.

- **`after … for each statement` triggers with transition tables** send a signal
  only when rows really changed.
- **The channel is private and read-only.** Anyone can listen; only the
  database can send, because no policy allows clients to write.
- **The feed shows a banner instead of refreshing itself.** Signals count new
  transfers, and a click calls `router.refresh()`, so rows do not move while
  someone reads them. Exports still refresh by themselves.
