# AGENTS.md — cardinal-designs

Adapted from my personal guide at `/Users/nicolealvarez/Downloads/software/AGENTS.md`
and tailored to this repository. The general rules below apply everywhere; the
stack-specific sections at the end add concrete conventions on top of them for
this repo's shape.

## About this project

Monorepo with two apps:

| App    | Stack                                                            |
| ------ | ---------------------------------------------------------------- |
| `web/` | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4    |
| `api/` | Express 4 · TypeScript · Prisma 6 · Neon Postgres                |

- Node 24 (`.nvmrc` at root), Yarn classic (`yarn` inside each folder).
- Run: `cd api && yarn dev` (:3001) + `cd web && yarn dev` (:3000).
- Lint: `cd web && yarn lint`. No formatter config exists — match surrounding code.
- Architecture: browser → Express REST API → Prisma → Neon. The frontend never
  touches the database; all API calls go through `web/lib/api.ts` (`apiFetch`).
- Auth: username/password → argon2 verify in `api` → random session token in an
  httpOnly `cardinal_session` cookie. Route protection lives in `web/proxy.ts`
  (matcher lists protected paths). Background: `docs/context/auth-notes.md`.

## Working style — read this first

- **Plan before you touch code.** If asked to review, debug, investigate, or
  "tell me why X happens," give analysis and reasoning only. Do not edit files
  until the plan is explicitly confirmed.
- **Explain in plain English.** Call out *why* a choice was made, not just what
  changed — especially trade-offs, framework quirks, or anything non-obvious.
- **Flag assumptions instead of guessing silently.** If a type, prop, env var,
  or config isn't visible, say so explicitly rather than inventing a
  plausible-looking value.
- **Match existing patterns.** Follow the naming conventions, file structure,
  and styling approach already in the repo (Tailwind classes, folder layout)
  rather than introducing a new pattern unprompted.
- **Be direct and concise.** No filler.
- **Call out risk.** If a change could break something (missing null check,
  breaking API change, security issue, version-specific gotcha), say so clearly
  before or alongside the diff.
- **When fixing a bug, explain the root cause first**, then the fix — don't
  just patch the symptom silently.

## Commit / diff behavior

- Summarize what changed and why after any edit, as a short bullet list.
- Prefer small, reviewable diffs over large rewrites unless asked otherwise.
- Never run `git commit` or `git push` unless explicitly asked.

## Code style

- TypeScript strict-mode assumptions unless a file shows otherwise.
- No unnecessary abstraction — straightforward, readable code over clever one-liners.
- Follow existing ESLint config (`web/eslint.config.mjs`) rather than
  introducing a different style.

## Modularity — components AND functions

Default to structuring new code so pieces can be reused across pages/features,
not just where they're first needed. These rules apply to **both UI components
and plain functions**:

### Components

- **Extract shared UI into its own file** as soon as a pattern is used in 2+
  places (a stat card, status badge, icon-button-with-tooltip action). Don't
  wait for a 3rd usage — flag it and propose the extraction.
- **One component, one responsibility.** If a component both fetches/holds data
  *and* renders a specific layout, split into a container (data/logic/state)
  and a presentational component (pure props in, JSX out) so the presentational
  piece can be reused with different data sources.
- **Props over hardcoded values.** When extracting, parameterize anything that
  varied between the places it was found (labels, colors, icons, handlers)
  rather than hardcoding the first use case and leaving TODOs.
- **Colocate by feature, not by type**, unless the repo already does otherwise.
- Truly generic cross-feature UI goes in `components/ui/`; feature-specific
  presentational pieces go in `components/<feature>/`.
- Don't over-abstract preemptively. Extract when a real second use case exists
  or is clearly imminent — not speculatively. Flag candidates for extraction
  when noticing repetition, but let the user confirm before restructuring
  existing files.

### Functions

The same rules as components, applied to logic:

- **One function, one responsibility.** A function that validates input *and*
  formats output *and* calls the API should be split; each piece stays testable
  and reusable on its own.
- **Extract shared helpers into `lib/` (web) or a service/util module (api)**
  once identical logic is needed by 2+ places — e.g. formatters, validators,
  date handling. Don't duplicate the same loop/mapping/validation inline in
  multiple files.
- **Parameterize instead of specializing.** A helper that could serve two
  callers shouldn't hardcode one caller's assumptions (fixed page size,
  hardcoded field list); take them as arguments with sensible defaults.
- **Pure helpers live apart from I/O.** Keep transformation/filtering logic
  pure (in `features/<feature>/types.ts` alongside domain types, or a utils
  module) and separate from fetch/API/service calls, so it can be reused and
  tested without mocking network.
- Same anti-over-abstraction rule: extract shared functions at the second real
  use, not speculatively.

## web/ — Next.js App Router conventions

Note: Next.js here is newer than common training data — check the auto-generated
rules in `web/AGENTS.md` (maintained by `next dev`, do not hand-edit) before
writing web code.

**Convention:** `app/**/page.tsx` stays thin — parse `searchParams`/`params`
into validated props and pass them to the feature container. All rendering,
state, and interactivity lives in `features/<feature-name>/`, with
presentational components in `components/<feature-name>/`:

```
app/
  dashboard/
    page.tsx                  # param parsing ONLY — no JSX beyond <DashboardPage />

features/
  <feature>/
    <feature>-page.tsx        # "use client" container — owns state, composes sections
    types.ts                  # domain types + pure helpers shared across the feature
    data.ts                   # static/mock data behind a source that can later swap for the API

components/
  ui/                         # truly generic cross-feature components ONLY
  home/
    hero.tsx                  # presentational, props in / JSX out
    search-bar.tsx
    card-grid.tsx
logout-button.tsx             # cross-feature component directly under components/
```

**Rules specific to `web/`:**

- **Container vs presentational.** Feature containers own state (search query,
  filters, forms) and pass plain props down; children are pure
  props-in/JSX-out so they can be reused with different data.
- **All server communication goes through `lib/api.ts`** (`apiFetch`). No bare
  `fetch("http://localhost:3001/...")` scattered in components; if a call needs
  options the wrapper lacks, extend the wrapper.
- **Route-scoped exception:** a component serving exactly one route may live in
  `features/<feature>/<route-segment>/`, mirroring the `app/**` path it renders.
  Once used by 2+ routes or shared, move it up to `components/<feature>/`.
- **Types**: define shapes returned by the API in `features/<feature>/types.ts`;
  import from there rather than re-declaring response shapes inline per file.
- **Client-side filtering of local data is fine** (no server round-trip for a
  local list). When real API-backed data arrives, the swap is localized:
  `data.ts` becomes an `apiFetch` call, the container's filtering stays.
- **Tailwind v4:** match existing palette/surrounding classes; visible focus
  states; dark mode via `prefers-color-scheme` in `globals.css`.
- **Route protection:** `proxy.ts` matcher lists only protected paths
  (`["/dashboard/:path*", "/login"]`). Public pages must render fully
  logged-out; auth checks belong in `proxy.ts` and protected pages only.

## api/ — Express + Prisma conventions

```
api/src/
  index.ts            # entrypoint: env load + app.listen
  app.ts              # express app: cors, cookie-parser, json, morgan, mounts routes
  config.ts           # typed env vars — the only place reading process.env
  prisma.ts           # Prisma client singleton — import from here, never new PrismaClient()
  middleware/
    auth.ts           # session-cookie authentication middleware
  routes/
    index.ts          # router mounting, e.g. /api/auth -> auth.routes.ts
    <domain>.routes.ts
  services/
    <domain>.service.ts
```

**Rules specific to `api/`:**

- **Route handlers stay thin**: validate input → call the service → send the
  response. No business logic (hashing lookups, DB queries, token generation)
  inside route handlers — that belongs in the matching `services/<domain>.service.ts`.
- **Services own business logic and Prisma access.** One service module per
  domain; routes and services are named after the domain
  (`auth.routes.ts` ↔ `auth.service.ts`).
- **Cross-cutting concerns become middleware** (auth, validation, logging) —
  don't repeat session checks inline in every route.
- **Env access only through `config.ts`**; add new vars there with defaults or
  explicit failure, and document them in the root README's Env files section.
- **Prisma client comes from `src/prisma.ts`** — never instantiate a second client.
- **Passwords are hashed with argon2**; sessions are random tokens stored in the
  Session table and sent back as the httpOnly `cardinal_session` cookie. Never
  compare secrets against client input with plain `===`/`!==` (see
  `docs/context/auth-notes.md`).
