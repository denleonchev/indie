# 09. Indexer pass lock

## Context

Cron starts an indexer pass every minute, and a pass can run longer than that.
The pass reaches the database through the Data API, where each call is its own
transaction.

## Decision

- **A lease row, not an advisory lock.** A lock does not live across API calls.
- **The lease ends after 3 × `PASS_SOFT_LIMIT_MS`,** so a pass that died blocks
  the indexer for minutes, not forever.
- **Each save checks the position,** so a pass that outlived its lease cannot
  overwrite newer work.
- **Add a heartbeat** if `position moved` shows up in the logs.

## Flow

```mermaid
sequenceDiagram
  participant Cron as pg_cron
  participant A as Pass A
  participant B as Pass B
  participant DB as indexer_state

  Cron->>A: start
  A->>DB: take lease (until 0:03)
  DB-->>A: ok
  A->>A: read 101..600 (node hangs)
  Note over DB: 0:03, lease expires
  Cron->>B: start
  B->>DB: take lease
  DB-->>B: ok, lease expired
  B->>DB: save 101..600 if position = 100
  DB-->>B: ok, position 600
  B->>DB: release lease
  A->>DB: save 101..600 if position = 100
  DB-->>A: rejected: position moved
  A->>DB: release lease
  DB-->>A: no-op, not A's lease
```
