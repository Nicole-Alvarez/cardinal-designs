# Project Bootstrap Instructions

Use this file when starting a new project for the first time.

This file defines the default project foundation, structure, coding principles, AI-agent behavior, and implementation standards.

It complements `context.md`.

`context.md` controls keyword routing such as:

- `question`
- `plan`
- `test`
- `@superpower`
- `@impeccable`
- token modes

`project.md` controls how a new project should be structured and built.

---

# 1. Project Identity

At project creation time, explicitly define:

- project name
- project purpose
- primary users
- deployment target
- runtime environment
- main framework
- database if used
- authentication approach if used
- external services if used

Do not begin implementation until the core stack is clear enough to avoid unnecessary rewrites.

---

# 2. Default Runtime

Use:

`Node.js 24`

unless the project explicitly requires another runtime.

Prefer currently supported LTS/stable tooling that is compatible with Node.js 24.

Do not silently downgrade Node.js unless a dependency requires it.

If a dependency is incompatible with Node.js 24, report the incompatibility before changing the runtime.

Recommended project metadata:

```json
{
  "engines": {
    "node": ">=24"
  }
}
```

Where appropriate, add a runtime-version file such as:

`.nvmrc`

or the project/tool equivalent.

---

# 3. Default Package Manager

Use:

`Yarn`

as the default package manager.

Prefer the package-manager version already configured by the project if one exists.

For a new project, explicitly record the Yarn version using the standard package-manager field when practical.

Example:

```json
{
  "packageManager": "yarn@<version>"
}
```

Do not mix package managers.

Avoid generating:

- `package-lock.json`
- `pnpm-lock.yaml`

when Yarn is the selected package manager.

The project should have one authoritative lockfile.

---

# 4. Default Language

Use:

`TypeScript`

by default for Node.js and frontend applications.

Prefer strict typing.

Recommended TypeScript principles:

- enable strict mode
- avoid `any` unless unavoidable and documented
- prefer explicit domain types
- validate untrusted runtime data
- distinguish compile-time types from runtime validation
- avoid unnecessary type assertions

Do not suppress type errors merely to finish implementation.

---

# 5. Framework Declaration

Do not assume a framework silently.

At project start, declare the framework explicitly.

Examples:

Frontend/full-stack:

- Next.js
- React + Vite
- Remix
- another explicitly selected framework

Backend:

- Fastify
- Hono
- Express
- NestJS
- another explicitly selected framework

Discord/bot:

- discord.js

CLI/tooling:

- plain Node.js + TypeScript when a framework is unnecessary

For every new project, record:

```text
Framework: <selected framework>
Framework version: <version>
Runtime: Node.js 24
Package manager: Yarn
Language: TypeScript
```

Do not introduce a framework when plain TypeScript is sufficient.

---

# 6. Project Start Summary

At the beginning of a new project, create or report a concise stack summary.

Example:

```text
Project: Example App
Runtime: Node.js 24
Language: TypeScript
Package manager: Yarn
Framework: Next.js
Database: PostgreSQL
ORM: Drizzle
Validation: Zod
Testing: Vitest
Deployment: Vercel
```

This summary should become the source of truth unless the user later changes the architecture.

---

# 7. AI-Agent Working Context

AI agents working in this repository must:

1. inspect the existing project before creating new patterns
2. follow current naming and folder conventions
3. preserve approved architecture
4. avoid unrelated refactors
5. avoid duplicating existing utilities/components
6. search for reusable code before creating new helpers
7. use existing dependencies when practical
8. avoid unnecessary new dependencies
9. verify behavior before claiming completion
10. preserve security, accessibility, and performance boundaries

Before creating a new component, helper, hook, service, or utility, check whether an appropriate implementation already exists.

Prefer extension over duplication.

---

# 8. Modular Architecture Principle

Build small, focused modules with clear responsibilities.

Prefer:

`small focused files`

instead of:

`large files containing many unrelated responsibilities`

Each module should ideally answer:

- What does this module do?
- What does it depend on?
- What uses it?
- Can it be tested independently?
- Can its internals change without breaking unrelated consumers?

If a file becomes difficult to understand because it contains many unrelated responsibilities, split it along meaningful boundaries.

Do not split files merely to make them shorter.

Split by responsibility, not arbitrary line count.

---

# 9. Reusable Components

UI components should be reusable when reuse is real and meaningful.

Prefer reusable primitives for common interface behavior such as:

- buttons
- dialogs
- inputs
- select controls
- form fields
- cards/surfaces
- badges
- navigation items
- loading states
- error states
- empty states
- tooltips
- dropdowns

A reusable component should:

- have a clear purpose
- accept explicit inputs/props
- avoid hidden application-specific behavior
- have sensible defaults
- support composition where appropriate
- remain accessible

Do not create generic components prematurely.

Bad abstraction:

`UniversalComponent` with dozens of unrelated props.

Better:

small components that compose together.

---

# 10. Feature Components

Feature-specific components may remain feature-specific.

Do not force every component into a global shared directory.

Prefer local feature ownership when a component is used only by one feature.

Example structure:

```text
features/
  templates/
    components/
    hooks/
    services/
    schemas/
    utils/
```

Promote a component/helper to shared infrastructure only after multiple features genuinely need it.

---

# 11. Component Responsibility

Avoid components that simultaneously handle:

- data fetching
- business rules
- complex transformations
- rendering
- persistence
- analytics
- navigation

when these concerns can be separated clearly.

A common preferred shape is:

```text
page/container
→ feature hook/service
→ domain/helper logic
→ presentational components
```

This is guidance, not a rigid rule.

Do not add layers when they provide no practical benefit.

---

# 12. Helper Functions

Create helper functions when they improve clarity, reuse, or testability.

Good reasons to extract a helper:

- logic is repeated
- logic is complex enough to obscure the caller
- logic has a clear standalone responsibility
- logic should be unit-tested independently
- logic performs deterministic transformation
- logic is domain-specific but reused
- parsing/formatting/validation is repeated

Examples:

- date formatting
- status mapping
- permission checks
- token parsing
- payload normalization
- sorting/ranking
- URL construction
- configuration normalization

Do not extract helpers for trivial one-line expressions used once unless extraction materially improves readability.

---

# 13. Helper Function Design

Prefer helpers that are:

- pure when possible
- deterministic
- narrowly scoped
- explicitly typed
- easy to test
- free from hidden global state

Prefer:

```ts
formatTemplateName(name)
```

over vague utilities such as:

```ts
processData(value)
```

Use meaningful domain names.

---

# 14. Avoid Generic Utility Dumping Grounds

Avoid files such as:

```text
utils.ts
helpers.ts
common.ts
misc.ts
```

that accumulate unrelated functionality.

Prefer focused utility modules such as:

```text
utils/
  format-date.ts
  normalize-endpoint.ts
  calculate-score.ts
```

or domain-focused modules such as:

```text
auth/
  permissions.ts
  tokens.ts
```

Keep related functionality together.

---

# 15. Hooks

For React projects, create custom hooks when they encapsulate reusable stateful behavior.

Good uses:

- API/query state
- keyboard behavior
- local feature state
- subscriptions
- responsive behavior
- shared form behavior

Do not move arbitrary code into hooks merely because it is inside a React component.

Hooks should have a clear behavioral purpose.

---

# 16. Services

Use service modules for external or infrastructure interactions when useful.

Examples:

- authentication provider
- database repository
- Discord API
- HTTP API client
- email provider
- object storage
- analytics provider

Prefer isolating external integrations behind small interfaces so the rest of the application is not tightly coupled to provider-specific implementation details.

Do not create service layers when the project is too small to benefit from them.

---

# 17. Validation

Validate all untrusted runtime data.

Examples:

- environment variables
- API requests
- API responses
- webhook payloads
- URL parameters
- form submissions
- database JSON blobs
- external service responses

Use the project's selected validation library.

Default recommendation:

`Zod`

for TypeScript projects unless another validator is already standard in the project.

Do not trust TypeScript interfaces as runtime validation.

---

# 18. Environment Variables

Use environment variables for secrets and deployment-specific configuration.

Do not hardcode:

- API keys
- OAuth secrets
- database credentials
- encryption keys
- tokens
- private endpoints

Create:

`.env.example`

with variable names and safe placeholder values.

Never place real credentials in `.env.example`.

Validate required environment variables at startup.

Fail early with a useful error if required configuration is missing.

---

# 19. Configuration

Centralize application configuration when it improves consistency.

Prefer one validated configuration module over repeated direct reads such as:

```ts
process.env.SOMETHING
```

throughout the application.

Example concept:

```text
config/env.ts
```

which validates and exports typed configuration.

Do not over-engineer configuration for tiny projects.

---

# 20. Error Handling

Handle errors intentionally.

Distinguish where useful between:

- user error
- validation error
- authentication error
- authorization error
- network error
- external-provider failure
- database error
- unexpected internal error

User-facing errors should be understandable and actionable.

Server logs may contain technical context but must not expose secrets.

Do not swallow errors silently.

Do not expose internal stack traces to end users in production.

---

# 21. Logging

Use structured logging when the project benefits from it.

Log:

- important lifecycle events
- failures
- external integration errors
- security-relevant events where appropriate
- useful request/job identifiers

Do not log:

- passwords
- access tokens
- refresh tokens
- Authorization headers
- private keys
- encryption keys
- sensitive personal information unless explicitly required and properly handled

---

# 22. Dependency Discipline

Before adding a dependency:

1. determine whether existing platform/framework functionality can solve the problem
2. check whether the repository already includes a suitable dependency
3. evaluate maintenance and bundle/runtime cost
4. add the dependency only if it provides meaningful value

Do not install a library for functionality that can be implemented safely and clearly with a few lines of standard platform code.

Do not reinvent security-critical functionality such as cryptography when a proven library/platform implementation exists.

---

# 23. Frontend State

Keep state as local as practical.

Do not introduce global state management automatically.

Prefer:

- local component state
- URL state
- server/query state
- feature-level context

before introducing a global store.

Add global state only when several unrelated parts of the application genuinely need coordinated client-side state.

---

# 24. API Boundaries

Keep API contracts explicit.

Prefer typed request/response schemas.

When frontend and backend share contracts, centralize shared types/schemas where practical.

Do not tightly couple UI rendering directly to raw external-provider responses.

Normalize provider data at the boundary.

Example:

```text
external API response
→ validation
→ normalization
→ application/domain model
→ UI
```

---

# 25. Database Access

Keep database access organized.

Avoid scattering raw database queries throughout UI/routes when the project becomes non-trivial.

Prefer focused repository/query modules or feature-owned data-access modules where helpful.

Do not create an elaborate repository pattern for tiny projects unless complexity warrants it.

Always preserve tenant/user authorization boundaries in database queries.

---

# 26. Authentication and Authorization

Treat authentication and authorization as separate concerns.

Authentication answers:

`Who is this user?`

Authorization answers:

`What is this user allowed to do?`

Do not rely solely on hidden UI controls for authorization.

Sensitive operations must verify permissions server-side.

Use deny-by-default behavior for sensitive features when appropriate.

---

# 27. Security Defaults

For new projects:

- validate untrusted input
- encode/sanitize output appropriately
- protect secrets
- use secure cookies when applicable
- use CSRF protection where architecture requires it
- verify webhook signatures
- enforce authorization server-side
- avoid arbitrary code execution
- avoid unsafe `eval`/`new Function`
- sandbox untrusted content
- use parameterized database queries/ORM protections
- apply rate limiting where abuse is realistic

Security boundaries should be explicit and testable.

---

# 28. Accessibility Defaults

For frontend projects, accessibility is part of implementation quality.

Use:

- semantic HTML
- labels for controls
- keyboard navigation
- visible focus states
- accessible dialogs
- appropriate ARIA only when needed
- reasonable touch targets
- sufficient contrast
- reduced-motion support

Do not add accessibility as a final cosmetic step.

---

# 29. Responsive Design

Build responsive behavior intentionally.

Do not assume desktop layout can simply shrink onto mobile.

For important screens, consider:

- desktop
- tablet
- mobile

Prioritize core actions and content on smaller screens.

Avoid excessive sticky UI consuming the viewport.

---

# 30. Performance Defaults

Do not optimize prematurely, but avoid obvious waste.

Prefer:

- lazy loading expensive modules
- code splitting where framework supports it
- avoiding unnecessary rerenders
- avoiding giant shared bundles
- efficient database queries
- pagination for large datasets
- caching where there is clear value

Measure before introducing complicated optimizations.

---

# 31. Testing Defaults

Use automated tests for important behavior.

Default TypeScript recommendation:

`Vitest`

unless the project already uses another framework.

Prioritize tests for:

- business rules
- authentication/authorization
- validation
- error paths
- helpers with non-trivial logic
- bug regressions
- critical user flows

Do not chase 100% line coverage.

Prioritize meaningful behavioral coverage.

---

# 32. Testability

Design code so important logic can be tested without requiring the entire application stack.

Prefer pure functions for deterministic domain logic.

Separate external I/O from calculation/decision logic where practical.

Example:

```text
HTTP/database input
→ normalize
→ pure domain logic
→ result
→ persistence/rendering
```

This makes tests faster and more reliable.

---

# 33. Folder Structure

Choose structure based on project size.

For small projects, keep it simple.

For growing applications, prefer feature/domain-oriented organization.

Example:

```text
src/
  app/
  components/
    ui/
  features/
    auth/
      components/
      services/
      schemas/
      utils/
    templates/
      components/
      hooks/
      services/
      schemas/
      utils/
  lib/
  config/
```

Do not create empty architecture folders before they are needed.

---

# 34. Shared Code

Shared code should truly be shared.

Use shared locations for things used across multiple features, such as:

- design-system primitives
- common validation
- generic API client infrastructure
- logging
- environment configuration
- generic formatting

Keep feature-specific logic with its feature.

---

# 35. Naming

Use names that communicate purpose.

Prefer:

- `calculateLagScore`
- `validateGoogleCallback`
- `TemplateSettingsDialog`

Avoid:

- `doStuff`
- `handleData`
- `helper2`
- `Manager` when the responsibility is unclear

Names should reveal intent.

---

# 36. Comments

Prefer readable code over excessive comments.

Comments are useful for:

- why a non-obvious decision exists
- security constraints
- compatibility workarounds
- external protocol requirements
- important invariants

Avoid comments that merely repeat the code.

---

# 37. Documentation

Every new project should have a useful root README.

Include where applicable:

- project purpose
- stack
- prerequisites
- Node version
- package manager
- installation
- environment setup
- development command
- test command
- build command
- production/start command
- deployment notes
- important architecture notes

A new developer should be able to run the project without guessing.

---

# 38. Standard Scripts

Where appropriate, expose predictable package scripts.

Recommended baseline:

```json
{
  "scripts": {
    "dev": "...",
    "build": "...",
    "start": "...",
    "test": "...",
    "typecheck": "...",
    "lint": "..."
  }
}
```

Only add scripts that the project actually supports.

---

# 39. New Project Checklist

Before first implementation, confirm:

- [ ] project purpose defined
- [ ] Node.js version defined
- [ ] Yarn selected/configured
- [ ] TypeScript configured
- [ ] framework selected
- [ ] folder structure appropriate to size
- [ ] linting configured where useful
- [ ] formatting strategy defined
- [ ] testing framework selected
- [ ] environment-variable strategy defined
- [ ] `.env.example` created if needed
- [ ] secrets excluded from source control
- [ ] README created
- [ ] development/build/test commands documented
- [ ] deployment target understood
- [ ] authentication/authorization approach defined if needed
- [ ] validation approach defined
- [ ] database/ORM defined if needed

Do not create infrastructure that the project does not need.

---

# 40. AI Implementation Checklist

Before creating code, AI agents should ask internally:

1. Does something equivalent already exist?
2. Is this logic feature-specific or truly shared?
3. Should this be a component, helper, hook, service, or plain function?
4. Can this remain simpler?
5. Is the boundary easy to test?
6. Am I introducing an unnecessary dependency?
7. Does this preserve existing architecture?
8. Does this preserve security and authorization?
9. What verification will prove it works?

Do not create abstraction simply because abstraction is possible.

---

# 41. Reuse Rule

Before duplicating code, search for an existing implementation.

If similar logic exists:

- reuse it when behavior is genuinely the same
- extend it when extension remains clean
- extract shared logic when duplication is meaningful

Do not force two subtly different domain behaviors into one generic helper merely to eliminate a few duplicated lines.

Clarity is more important than artificial DRYness.

---

# 42. Refactoring Rule

Refactor when it directly supports the current task.

Good reasons:

- current code makes the requested change unsafe
- duplication would become substantial
- boundaries prevent testing
- security logic is scattered
- a component has clearly mixed responsibilities

Do not perform unrelated cleanup across the repository while implementing a focused feature.

---

# 43. AI Context Efficiency

AI agents should minimize unnecessary context consumption.

Prefer:

- targeted file inspection
- relevant dependency tracing
- focused searches
- reuse of already gathered context

Avoid repeatedly reading the entire repository.

The token-budget rules in `context.md` remain authoritative for requested planning/testing workflows.

---

# 44. First-Time Project Workflow

Recommended sequence:

```text
Define project goal
→ choose stack
→ record Node/Yarn/framework versions
→ initialize repository
→ configure TypeScript
→ configure environment handling
→ establish minimal folder structure
→ add validation/testing/linting as needed
→ build first vertical feature slice
→ test
→ verify
→ expand architecture only when required
```

Prefer a working vertical slice over building a large abstract architecture before any product behavior exists.

---

# 45. Vertical Slice Principle

For a new application, prefer implementing one complete useful flow early.

Example:

```text
UI
→ validation
→ business logic
→ data/API
→ response
→ test
```

This validates the architecture before many features depend on it.

Avoid spending the first phase building dozens of unused abstractions.

---

# 46. Framework-Specific Conventions

Once a framework is selected:

- follow its current recommended conventions
- prefer framework-native features when they fit
- avoid fighting the framework
- keep framework-specific code near boundaries
- keep domain/business logic portable where practical

Do not introduce patterns from a different ecosystem without a concrete benefit.

---

# 47. Version Recording

At project initialization, record important versions in the repository.

At minimum where relevant:

- Node.js version
- package-manager version
- framework version
- TypeScript version
- database/ORM version

The lockfile remains authoritative for dependency resolution.

Do not rely only on documentation text that can become stale.

---

# 48. Project Decisions

When an architectural decision is important and likely to affect future work, record it briefly.

Examples:

- database choice
- auth provider
- deployment model
- API style
- multi-tenancy approach
- state-management choice

Avoid excessive ADR/process overhead for trivial decisions.

Document decisions that future agents/developers need to understand.

---

# 49. Completion Standard

A new feature or project foundation is not complete merely because code exists.

Completion requires appropriate evidence such as:

- tests pass
- typecheck passes
- lint passes where configured
- production build passes
- critical flows manually/automatically verified
- README/config updated where necessary
- no unrelated changes
- no exposed secrets

Never claim completion without verification.

---

# 50. Final Project Principles

Default priorities:

1. correctness
2. security
3. clarity
4. maintainability
5. modularity
6. reuse where meaningful
7. testability
8. accessibility for UI projects
9. performance without premature optimization
10. simplicity

Use:

`Node.js 24`

with:

`Yarn`

and:

`TypeScript`

by default unless the project's requirements explicitly choose otherwise.

Build components and modules to be reusable when reuse is real.

Create helper functions when they improve clarity, reuse, domain separation, or testability.

Avoid both extremes:

- giant monolithic files
- excessive micro-abstractions

The preferred result is:

`clear`
→ `modular`
→ `reusable where useful`
→ `easy to test`
→ `easy to maintain`
→ `verified`
