# 07. Export files

## Context

An export file holds private data. The secret key must stay off the web server,
and code that bypasses policies must not serve users.

## Decision

- **Files live in a private bucket** at `exports/<wallet>/<export id>.csv`. The
  worker uploads them with the secret key.
- **The web server signs links as the user.** A policy on `storage.objects`
  lets a user read only their own folder.
- **A link lives ten minutes,** and a new one is signed on every page view.
  Exports and files are deleted after seven days.
- **No `api` function and no Hono for now.** Requests and links go through the
  web data layer, so `api` would only forward calls.
