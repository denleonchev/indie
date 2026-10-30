# 03. Wallet address of a signed-in user

## Context

Users sign in with the Supabase Web3 provider (EIP-4361). Auth checks the
signature and stores the wallet address in two places: `auth.identities`, which
only Auth writes, and `user_metadata` in the token. Users can change their own
`user_metadata` with `updateUser`, so a forged address there ends up in a new,
correctly signed token.

## Options

**A. Read the address from `user_metadata`.** No extra code. Costs: any user can
claim any address.

**B. Call `getUser()` and read `identities`.** The address is trusted. Costs: one
request to Auth on every page load.

**C. Put the address into the token with an auth hook.** A custom access token
hook reads `auth.identities` and adds a `wallet` claim. The page reads it with
`getClaims()`, which checks the ES256 signature locally against the JWKS.
Costs: one more database function that Auth calls on every token.

## Decision

Option C.

- **Access logic uses only the `wallet` claim,** never `user_metadata`.
- **The hook leaves the token unchanged** when a user did not sign in with a
  wallet.
- **Private data will use RLS** on `auth.jwt() ->> 'wallet'` or on `auth.uid()`.
- **Transfers are public,** so the "own transfers" filter is not a security
  boundary.
