# 01. Stack

## Context

The service reads ERC-20 transfers from a chain and shows each wallet owner
their own history. The work comes in bursts: read a range, write what was
found, wait.

Two product constraints decide the shape:

- **Nobody operates it.** It answers a link at any time, with no one on call
  and days between visits.
- **Small by design.** One network, one or two contracts, a handful of users.
  A minute behind the chain is fine — the service waits for confirmations
  anyway.

## Options

**A. A process kept in memory.** A timer, a connection pool and a queue, all
inside one running process. Lower delay, faster backfill, no lock needed, and
something you can start and watch while debugging. Costs a host that has to be
kept alive, patched and watched — by someone who does not exist here.

**B. Functions on a schedule.** Each pass is one call, and nothing exists
between calls. Position and queue live in the database, so a restart costs
nothing and there is nothing to keep alive. Costs: a pass holds nothing in
memory and reads its position every time, overlap is prevented by a lock rather
than by there being one process, a long backfill spreads over many calls,
packages with native code are unavailable, and the scheduler and queue are
platform-specific. Two places to deploy.

Everything A wins is worth nothing here: a minute of delay disappears inside
the confirmation wait, backfill runs once, and the lock is a few lines. What B
wins is the one thing the constraints name — nothing to keep alive.

## Decision

Option B.

| Part         | Choice                          |
| ------------ | ------------------------------- |
| Compute      | Supabase Edge Functions (Deno)  |
| Routing      | Hono                            |
| Database     | Supabase Postgres               |
| Schedule     | `pg_cron` through `pg_net`      |
| Queue        | pgmq                            |
| Chain access | viem                            |
| Auth         | Supabase Auth, wallet signature |
| Interface    | Next.js on Vercel               |
