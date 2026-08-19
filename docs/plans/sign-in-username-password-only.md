# Plan: Username + Password Only Sign-in

Status: In progress
Date: 2026-08-19
Scope: api/, web/, docs/

## Context

- Login currently requires username, password, AND a "secret key" field.
- `AUTH_SECRET_KEY` is an env var in `api/.env`, read at api/src/config.ts:11.
- It is compared against client-supplied input at api/src/services/auth.service.ts:19
  (plain string `!==`, not timing-safe).
- It is NOT used to sign tokens; sessions use random 32-byte hex tokens
  (auth.service.ts:33) stored in the Session table.
- Effectively an app-wide backdoor password printed by api/prisma/seed.ts:20.
- Conclusion: not needed in the login flow. It belongs server-side only
  (see docs/context/auth-notes.md).

## Tasks

1. web/app/login/page.tsx
   - Remove secretKey input field.
   - Remove secretKey from submit body.
2. api/src/routes/auth.routes.ts
   - Stop destructuring secretKey from req.body.
3. api/src/services/auth.service.ts
   - Remove the secretKey check in login().
4. api/src/config.ts
   - Keep `authSecretKey` (server-side only, future use); no client checks.
5. api/prisma/seed.ts
   - Stop printing the secret key value.
6. README.md
   - Remove secret-key mentions from Login section and seed docs.
7. Docs
   - docs/context/auth-notes.md — secret key decision.
   - docs/testing/login-username-password.md — verification steps.

## Verification

- `cd api && yarn build`
- `cd web && yarn build`
- Manual: login with admin/admin123 only; wrong password rejected;
  dashboard loads (session cookie still works).

## Acceptance Criteria

- Login form has exactly username + password fields.
- API /api/auth/login accepts only username + password.
- Secret key never sent from client, never compared against client input.
- No reference to secret key in README/seed output.