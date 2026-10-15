# Wallet activity

Requirements: docs/vision-and-scope.md. Architecture decisions + rationale: docs/adr/.
Rules below take precedence.

## Stack (see docs/adr/ for rationale)

- Compute: Supabase Edge Functions (Deno)
- Routing: Hono
- Database: Supabase Postgres
- Schedule: `pg_cron` through `pg_net`
- Queue: pgmq
- Chain access: viem
- Auth: Supabase Auth, wallet signature (EIP-4361)
- Interface: Next.js on Vercel

## Priorities

UX and edge cases > visual polish > code quality. Ship working slices end-to-end.
Don't build features not in docs/vision-and-scope.md, even if they seem obviously useful.

## Docs

docs/adr/ is the single source of truth for architecture rationale.
CLAUDE.md's Stack list and README.md's Stack section only summarize
it with a link back — don't restate rationale there. When an architectural
decision changes, update docs/adr/ first, then check whether the Stack
list (here) or README summary needs a one-line edit to match.

## Conventions

- Never commit, push, or open a PR unless explicitly told to. Leave finished work
  in the working tree and say it's ready. Branches may be created freely.
- Commits: feat|fix|refactor|chore|docs(scope): imperative
- Scopes: indexer, queue, db, auth, web, export, infra
- Branches: type/short-description
- Issues: one per slice of the roadmap, titled `Slice N: short description`
  (`Slice 1: Transfers batch`). Keep every section tight — these are size caps, not
  targets to fill. Body sections, in this order:
  - `## Slice` — one or two sentences: what works end-to-end once it's done.
  - `## Scope` — `In:` what the slice covers; `Out:` what it deliberately
    leaves. One line each, items comma-separated, not a sentence per item.
  - `## Acceptance` — checklist, including error/edge-case states; ticked off
    as the slice lands. One line per item.
  - `## Notes` — decisions worth recording, deferred work. Two sentences max.
- PRs: title in commit format, body always linking an issue with `Part of #N` —
  the slice it implements, or the slice it was done under for infra and process
  work. Never `Closes`: issues are closed by hand. Keep every section tight —
  these are size caps, not targets to fill. Sections, in this order:
  - `## What` — one or two sentences: what now works or changed, ending with the
    issue link.
  - `## Why` — only when the decision isn't obvious: why this way, not another.
    Three sentences max, one decision per sentence — if it needs more, it
    belongs in a new ADR in docs/adr/, linked from here instead.
  - `## How to test` — manual steps, or "covered by tests". Four sentences max.
  - `## Notes` — what was deliberately left out, what's deferred. Two sentences
    max.
