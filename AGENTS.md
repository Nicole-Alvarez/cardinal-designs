# Project Agent Instructions

Before planning, testing, answering project questions, or modifying this repository:

1. Read `context.md`.
2. Read `project.md`.
3. Treat both files as project-level instructions for this repository.
4. Follow them for all subsequent work unless the user explicitly overrides a rule.

## Instruction Responsibilities

`context.md` defines HOW the agent works, including:

- `question`
- `plan`
- `test`
- `@superpower`
- `@impeccable`
- token-budget keywords
- subagent limits
- permission behavior
- Git restrictions
- testing and verification workflows

`project.md` defines HOW the project should be engineered, including:

- Node.js version
- package manager
- TypeScript standards
- framework/runtime declaration
- architecture
- modularity
- reusable components
- helper functions
- validation
- security
- testing
- dependencies
- project structure

## Required Behavior

Always read both instruction files before beginning substantial work.

Do not duplicate their contents here.

If instructions conflict, use this priority:

1. Explicit current user instruction
2. `AGENTS.md`
3. `context.md`
4. `project.md`
5. Existing repository conventions

If an existing project conflicts with `project.md`, do not blindly rewrite the project. Report the conflict and follow the user's requested scope.

Do not create branches or worktrees.

Do not commit, amend, merge, or push changes.

Work on the currently checked-out branch and leave changes uncommitted for user review.

Project-scoped operations permitted by `context.md` should proceed according to its permission rules.

## First-Time Project Initialization

For a new or empty project:

1. Read `context.md`.
2. Read `project.md`.
3. Inspect the repository.
4. Determine the requested project requirements.
5. Apply the engineering defaults from `project.md`.
6. Use the workflow selected by the user's keywords from `context.md`.

Do not begin implementation when the selected workflow requires planning, design, or approval first.