# 08. Tests

## Context

Code runs in Deno, Node and Postgres, and much of the logic lives in SQL.

## Decision

- **Edge Functions: `deno test`.** Node runners cannot load `jsr:` and `npm:`
  imports. The indexer is tested with a fake `Store`.
- **SQL: pgTAP through `supabase test db`.** Tests switch the role, so policies
  are checked as the browser sees them.
- **Interface: Vitest,** for pure functions only.
- **No end-to-end tests for now.**
