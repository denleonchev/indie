# Wallet activity

Reads ERC-20 transfers from an EVM chain and shows each wallet owner their own
history.

**Status: in progress.** Indexing and storage work. The dashboard, live
updates and export are not built yet.

## What it does

A pass runs on a schedule, reads a range of blocks, decodes `Transfer` events
and stores them. It keeps its position in the database, so it can stop at any
point and continue later without gaps or duplicates. Records near the head of
the chain are not final until enough confirmations pass, and a replaced branch
is rolled back.

You sign in with a wallet signature. The address travels in your token, and
row-level policies in the database compare it against each row, so a client can
only read its own transfers. The interface talks to the database directly; there
is no API layer in between.

## Stack

| Part         | Choice                                     |
| ------------ | ------------------------------------------ |
| Compute      | Supabase Edge Functions (Deno)             |
| Routing      | Hono                                       |
| Database     | Supabase Postgres                          |
| Schedule     | `pg_cron` through `pg_net`                 |
| Queue        | pgmq                                       |
| Chain access | viem                                       |
| Auth         | Supabase Auth, wallet signature (EIP-4361) |
| Interface    | Next.js on Vercel                          |

Nothing runs between passes. All state — position, queue, data — lives in
Postgres. See [docs/adr/01-stack.md](docs/adr/01-stack.md) for why.

## Running it

Requires the Supabase CLI and Node 20+.

```bash
supabase start                 # local stack
supabase db reset              # apply migrations
supabase functions serve       # run functions locally

cd web && npm install && npm run dev
```

Copy `.env.example` and fill it in:

```
RPC_URL=              # chain endpoint
CHAIN_ID=
TOKEN_ADDRESSES=      # comma separated
CONFIRMATIONS=        # blocks before a record is final
RANGE_SIZE=           # blocks per pass

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

No chain address, endpoint or key belongs in code. Secret keys are never
exposed to the browser.

## Deploying

```bash
supabase db push
supabase functions deploy
```

The interface deploys to Vercel from the `web` directory.

## Layout

```
supabase/functions/   indexer, worker, api, _shared
supabase/migrations/  schema and policies
web/                  interface
docs/adr/             decisions
```

## Limits

- The native coin is not tracked: ETH transfers emit no log events
- One network at a time; network and contracts come from configuration
- The service never writes to the chain, and holds no private keys

## Docs

- [Vision and scope](docs/vision-and-scope.md)
- [01. Stack](docs/adr/01-stack.md)
