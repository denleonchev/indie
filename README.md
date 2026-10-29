# Wallet activity

Reads ERC-20 transfers from an EVM chain. Anyone can see the latest transfers,
and each wallet owner can see their own.

**Status: in progress.** Every minute the indexer saves the newest block, and
the web page shows it. Transfers, sign-in, live updates and export are not
built yet.

## What it does

A pass runs on a schedule, reads a range of blocks, decodes `Transfer` events
and stores them for the last 14 days. It keeps its position in the database,
so it can stop at any point and continue later without gaps or duplicates. Records near the head of
the chain are not final until enough confirmations pass, and a replaced branch
is rolled back.

Transfers are public, as they are on the chain. You sign in with a wallet
signature to see your own transfers and exports. The address travels in your
token, and row-level policies in the database compare it against each row, so a
client can only read its own exports. The interface talks to the database
directly; there is no API layer in between.

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

Requires Docker and Node 20.9+.

```bash
npm install                    # Supabase CLI and Deno, pinned
cp supabase/functions/.env.example supabase/functions/.env
# set CRON_SECRET in it: openssl rand -hex 32
npx supabase start             # local stack
npm run db:reset               # apply migrations, fill local Vault
npx supabase functions serve   # run functions; cron calls the indexer
```

After a change to `CRON_SECRET`, run `npm run db:seed:vault` and restart
`functions serve`.

```bash
cd web
npm install
cp .env.example .env.local     # add the publishable key from `npx supabase status`
npm run dev
```

No chain address, endpoint or key belongs in code. Secret keys are never
exposed to the browser.

## Deploying

Pushes to `main` deploy migrations and functions through the Supabase GitHub
integration, and the interface through Vercel from the `web` directory.

Secrets are set by hand, once per environment:

```bash
npx supabase secrets set CRON_SECRET=... CHAIN_ID=... RPC_URL=...
```

```sql
select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
select vault.create_secret('<the same CRON_SECRET>', 'cron_secret');
```

In Vercel, set `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Layout

```
supabase/functions/   indexer, worker, api, _shared
supabase/migrations/  schema and policies
web/                  interface
docs/adr/             decisions
```

## Limits

- The native coin is not tracked: ETH transfers emit no log events
- History covers the last 14 days, not the whole life of a token
- One network at a time; network and contracts come from configuration
- The service never writes to the chain, and holds no private keys

## Docs

- [Vision and scope](docs/vision-and-scope.md)
- [01. Stack](docs/adr/01-stack.md)
- [02. History window](docs/adr/02-history-window.md)
