# cardinal-designs

Monorepo with a Next.js frontend (`web/`) and an Express + Prisma backend (`api/`).

## Requirements

- Node 24 (`.nvmrc` at root — `nvm use`)
- Yarn classic (`npm i -g yarn` or via corepack)
- A Neon (Vercel) Postgres database — connection string in `api/.env` (`DATABASE_URL`)

## Setup

```bash
# 1. Node + deps
nvm use
cd api && yarn && cd ../web && yarn && cd ..
```

The database lives on Neon; `DATABASE_URL` is already set in `api/.env`.
To point at a different database, update `DATABASE_URL` there.

## Run

```bash
# Terminal 1 — backend on :3001
cd api && yarn dev

# Terminal 2 — frontend on :3000
cd web && yarn dev
```

The backend auto-runs `prisma generate` + `prisma migrate deploy` on every
`yarn dev`/`yarn start`, so the ORM client is always in sync with the schema.
`yarn dev` also starts Prisma Studio on http://localhost:5555.

## Seed (optional)

Creates the sample login user (`admin` / `admin123`):

```bash
cd api && yarn db:seed
```

## Login

- URL: http://localhost:3000/login
- Username: `admin`
- Password: `admin123`

## Env files

- `api/.env` — `DATABASE_URL`, `AUTH_SECRET_KEY`, `PORT`, `FRONTEND_URL`
- `web/.env.local` — `NEXT_PUBLIC_API_URL`

## Scripts

| App  | Command             | Description                              |
| ---- | ------------------- | ---------------------------------------- |
| api  | `yarn dev`          | tsx watch + Prisma auto-prepare + Studio |
| api  | `yarn build`        | Compile TypeScript to `dist/`            |
| api  | `yarn start`        | Run compiled build                       |
| api  | `yarn db:seed`      | Insert sample user + print secret key    |
| api  | `yarn studio`       | Open Prisma Studio on :5555              |
| web  | `yarn dev`          | Next.js dev server                       |
