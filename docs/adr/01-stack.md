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

## Functions

Functions are split by who calls them and with what rights, not by endpoint,
so code that bypasses policies never shares a function with code that serves
users.

| Function  | Called by             | Rights                             | Routing        |
| --------- | --------------------- | ---------------------------------- | -------------- |
| `indexer` | `pg_cron`             | secret key, bypasses policies      | `Deno.serve`   |
| `worker`  | `pg_cron`, for pgmq   | secret key, bypasses policies      | `Deno.serve`   |
| `api`     | users, external hooks | by task: user token or secret key  | Hono           |

- **Hono only where there are several routes.** `api` serves export and the
  notification channel webhook, which share auth, CORS and error handling.
  `indexer` and `worker` have one handler each and need no router.
- **Every function URL is public.** `pg_net` calls the scheduled functions
  through the same gateway as browsers, so they authenticate the caller too.
- **Scheduled calls carry a dedicated `CRON_SECRET`,** stored in Vault for
  `pg_cron` and in function secrets. It is separate from the project secret
  key: a leak lets someone wake the scheduled functions, not read or write
  data.
- **Cheap checks come first.** The secret is checked before the lock, and the
  lock is taken before any RPC call, so an unwanted call costs one database
  query, not provider quota.
- **Configuration is split by consumer.** Functions read
  `supabase/functions/.env`, the interface reads `web/.env.local`, so server
  secrets never sit next to values that reach the browser.
