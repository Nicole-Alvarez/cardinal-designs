# Testing: Login (Username + Password Only)

Date: 2026-08-19
Plan: docs/plans/sign-in-username-password-only.md

## Build checks

- [x] `cd api && yarn build` passes
- [x] `cd web && yarn build` passes

## Manual tests

1. Start backend (`cd api && yarn dev`) and frontend (`cd web && yarn dev`).
2. Seed DB if needed: `cd api && yarn db:seed` (admin / admin123).
3. Open http://localhost:3000/login
   - [ ] Login form shows exactly two fields: Username, Password
   - [ ] No secret key field present
4. Correct credentials (admin / admin123):
   - [ ] Login succeeds, redirects to /dashboard
   - [ ] Dashboard loads (session cookie works)
5. Wrong password:
   - [ ] Login rejected with error message
6. Unknown user:
   - [ ] Login rejected with generic "Invalid username or password"
7. API check (curl):
   - [ ] `POST /api/auth/login` with only username + password succeeds
   - [ ] Sending a `secretKey` in the body is ignored (no error)

## Regression

- [ ] /api/auth/me still works with session cookie
- [ ] Logout still works, subsequent /me returns 401