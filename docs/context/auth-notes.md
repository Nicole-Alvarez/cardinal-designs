# Auth Notes: Secret Key

Date: 2026-08-19

## What AUTH_SECRET_KEY was

- Env var in `api/.env`, read at `api/src/config.ts` (`authSecretKey`).
- Previously required from the client as a third login field.
- Compared against client input with plain `!==` in `auth.service.ts` login()
  (not timing-safe).
- NOT used to sign sessions — sessions use random 32-byte hex tokens stored
  in the Session table. So it was effectively an app-wide "backdoor password".

## Decision

- Not needed in the login flow; removed as a login credential (2026-08-19).
- The env var and `config.authSecretKey` remain in the backend for
  server-side-only use (e.g., future token signing). It is never sent from
  the client and never compared against client input.
- If the secret key is not used by any server-side feature in the future,
  it can be removed entirely from `config.ts` and `.env`.

## Login flow now

1. Client sends `{ username, password }` to POST /api/auth/login.
2. Backend looks up user, verifies argon2 password hash.
3. Backend creates a session row + httpOnly `cardinal_session` cookie.
4. Subsequent requests authenticate via the cookie.