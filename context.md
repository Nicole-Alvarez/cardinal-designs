**Codex context usage**

# Codex Project Operating Instructions

These instructions define how Codex should interpret special keywords and execute work in this repository.

They apply throughout the project unless a more specific user instruction overrides them.

Keywords and tags are case-insensitive.

Primary keywords:

- `question`

- `plan`

- `test`

Skill tags:

- `@superpower`

- `@impeccable`

Token-budget tags:

- `@tokenlow`

- `@tokenmid`

- `@tokenhigh`

- `@tokenxhigh`

- `@tokenultra`

- `@tokenmax`

The default token mode is:

`@tokenmid`

---

# 1. Core Operating Rules

Before acting on repository work:

1. Inspect the current project structure and only the files relevant to the task.

2. Understand existing architecture and conventions before proposing changes.

3. Preserve existing working behavior unless the requested task requires changing it.

4. Do not make unrelated changes.

5. Do not expose, print, log, or unnecessarily access secrets.

6. Do not silently change backend APIs, authentication behavior, database schemas, deployment architecture, or security boundaries.

7. Prefer existing project patterns and dependencies.

8. Do not introduce unnecessary dependencies.

9. Follow YAGNI.

10. Verify implementation using the repository's actual tooling.

11. Never claim something works unless the relevant verification actually passed.

12. If implementation reveals a genuine architectural or security conflict, report it instead of silently changing the approved design.

---

# 2. Keyword Router

Interpret the following keyword combinations according to the rules below.

The most specific matching combination wins.

Important distinction:

`question`

\= read-only

`plan`

\= planning mode

`@superpower`

\= use Superpowers process

`@impeccable`

\= use Impeccable for UX/UI quality

Token tags

\= control the depth/resource intensity of planning and implementation

---

# 3. `question`

Meaning:

\> Answer the user's question only.

`question` is a hard read-only override.

When `question` is present:

- do not modify files

- do not create patches

- do not scaffold code

- do not implement

- do not continue previously approved implementation work

- do not commit

- do not change configuration

- do not install dependencies

You may:

- inspect relevant files when necessary

- inspect existing code

- explain architecture

- explain errors

- compare approaches

- give recommendations

- show example code in chat

- explain commands

- explain possible implementation changes

If code examples are requested, they may be shown in the response but must not be written into the repository.

Examples:

`question how does Google OAuth work here?`

→ inspect relevant auth files if needed  

→ explain  

→ no edits

`question why does this component rerender?`

→ inspect component  

→ explain cause and possible fixes  

→ no edits

`question can this run on Vercel?`

→ explain feasibility and tradeoffs  

→ no implementation

---

# 4. `question` With Other Keywords

`question` always keeps the request read-only.

## `question plan`

Answer the question and provide a plan.

Do not modify files.

## `question @superpower`

Use Superpowers only for analysis if applicable.

Do not implement.

## `question @impeccable`

Use Impeccable only for UX/UI analysis or audit.

Do not implement.

## `question plan @superpower`

Use Superpowers to produce the appropriate design/plan, but remain read-only.

## `question plan @impeccable`

Run the relevant Impeccable audit/analysis and provide an improvement plan.

Do not implement.

## `question plan @superpower @impeccable`

Use both skills to produce the combined analysis/design/plan.

Do not implement anything.

`question` overrides any workflow that would normally permit implementation.

---

# 5. `plan`

Meaning:

\> Analyze the requested task and produce an implementation plan.

When `plan` appears by itself:

- inspect relevant existing code first

- identify current behavior

- identify affected files/components

- identify dependencies

- identify risks

- list implementation steps in logical order

- include tests

- include edge cases

- include verification commands where appropriate

Do NOT implement.

Do NOT modify files.

Do NOT invoke Superpowers solely because the word `plan` exists.

Do NOT invoke Impeccable solely because the word `plan` exists.

Suggested output:

## Goal

## Current State

## Affected Areas

## Implementation Steps

## Tests

## Risks / Edge Cases

## Verification

## Estimated Usage

Example:

`plan add Google login`

→ inspect current auth system  

→ give normal implementation plan  

→ no file changes

---

# 5A. `test`

Meaning:

> Diagnose and test an existing feature, task, workflow, component, or behavior and report what is wrong.

`test` is diagnostic and read-only by default.

Preferred forms:

`test '<feature-name/task>'`

`test @superpower '<feature-name/task>'`

Examples:

`test 'Google login'`

`test 'template editor save flow'`

`test 'mobile navigation drawer'`

When `test` appears without `@superpower`:

- inspect the relevant implementation
- determine the expected behavior from existing code, tests, docs, or approved specs
- run the smallest useful existing tests/checks first
- reproduce the requested behavior where practical
- diagnose confirmed failures, regressions, edge cases, and unexpected behavior
- report checks that passed
- report errors found
- explain likely root causes with evidence
- recommend what should be fixed
- do NOT modify files
- do NOT create patches
- do NOT refactor
- do NOT commit
- do NOT install dependencies unless explicitly requested
- do NOT invoke Superpowers solely because `test` is present

The normal flow is:

`inspect`
→ `test`
→ `diagnose`
→ `report`

not:

`inspect`
→ `fix`

## Normal `test` Output

Use this structure when practical:

### Test Target

What feature/task was tested.

### Result

Use one of:

- PASS
- PASS WITH WARNINGS
- FAIL
- BLOCKED

### Checks Run

List only checks actually executed.

### Errors Found

List confirmed errors.

If none:

`No confirmed errors found.`

### Warnings / Risks

List suspicious behavior, uncovered edge cases, or incomplete coverage.

### Likely Cause

For failures, explain the most likely root cause and distinguish confirmed evidence from inference.

### Recommended Fix

Explain what should probably change.

Do NOT implement it.

### Verification Notes

State what was and was not actually verified.

## `test @superpower`

Meaning:

> Diagnose/test the requested feature using the appropriate Superpowers testing/debugging workflow.

Superpowers becomes the process authority for diagnosis.

Use the relevant installed Superpowers skills when appropriate, such as:

- systematic-debugging
- test-driven-development when a regression test is useful for diagnosis
- verification-before-completion
- other relevant diagnostic/testing skills

However, `test @superpower` is still diagnostic by default.

Do NOT automatically fix a discovered problem unless the user explicitly asks for implementation afterward.

Expected flow:

`target feature`
→ `Superpowers diagnostic workflow`
→ `reproduce`
→ `evidence collection`
→ `root-cause analysis`
→ `verification`
→ `report`

## `test @superpower` Token Modes

Token-budget keywords apply to `test @superpower`.

If no token mode is supplied:

use `@tokenmid` automatically.

Examples:

`test @superpower 'Google login'`

means:

`test @superpower @tokenmid 'Google login'`

`test @superpower @tokenlow 'logout redirect'`

→ targeted low-cost debugging

`test @superpower @tokenhigh 'authentication flow'`

→ deeper subsystem diagnosis

`test @superpower @tokenxhigh 'template editor'`

→ broader integration, edge-case, and regression diagnosis

Do not ask the user to choose a token mode when none is supplied.

## Estimated Usage for `test @superpower`

Every `test @superpower` response must include:

### Estimated Usage

Report:

- Token mode used
- Estimated testing/diagnostic cost
- Estimated 5-hour impact as a percentage range
- Estimated 7-day impact as a percentage range
- Confidence: LOW / MEDIUM / HIGH
- Main cost drivers
- Lower-token alternative when useful

Example:

```text
Token mode: @tokenmid (default)

Testing/diagnosis:
5-hour impact: ~4–8%
7-day impact: ~1–2%

Confidence: LOW

Main cost drivers:
- relevant code inspection
- targeted reproduction
- test execution
- Superpowers systematic debugging
```

These percentages are estimates, not measured account usage.

Never claim knowledge of the user's actual remaining quota unless that information is explicitly available.

## Token Behavior for `test @superpower`

`@tokenlow`
- highly targeted inspection
- smallest useful reproduction
- 0–1 subagent by default
- concise diagnosis

`@tokenmid`
- DEFAULT
- relevant subsystem inspection
- targeted reproduction
- relevant tests and likely edge cases
- one root-cause verification pass
- up to 2 useful subagents if genuinely needed

`@tokenhigh`
- broader subsystem analysis
- related callers/consumers
- stronger regression testing
- up to 3 useful subagents

`@tokenxhigh`
- full affected feature flow
- deeper integration and edge-case checks
- security/performance checks where relevant
- up to 5 useful subagents

`@tokenultra`
- broad subsystem diagnosis
- multiple integrations
- specialized reviews where useful
- up to 7 useful subagents

`@tokenmax`
- maximum reasonable diagnostic rigor
- no fixed subagent cap
- inspect all materially relevant paths
- broad integration/regression analysis
- still avoid deliberate waste

## `test @impeccable`

Meaning:

> Audit/test an existing frontend feature with Impeccable and report UX/UI issues without implementing them.

Example:

`test @impeccable 'template editor'`

Use Impeccable to:

- audit the requested UI
- provide a score when available
- report usability, accessibility, responsive, performance, and implementation-integrity findings
- categorize findings by priority where useful
- recommend improvements
- make no file changes

## `test @superpower @impeccable`

For frontend features, combine both skills.

Superpowers handles technical diagnosis.

Impeccable handles UX/UI diagnosis.

Example:

`test @superpower @impeccable @tokenmid 'template editor'`

Expected flow:

`technical testing`
→ `Superpowers debugging`
→ `Impeccable UX/UI audit`
→ `combined findings`
→ `no implementation`

Report where relevant:

- functional errors
- technical root causes
- UX/UI findings
- accessibility findings
- Impeccable score
- recommended fixes
- estimated token usage

## `test` Does Not Fix by Default

Both:

`test '<task>'`

and:

`test @superpower '<task>'`

are diagnostic unless the user explicitly requests fixes afterward.

Typical follow-ups:

`plan fix the errors found in the previous test`

`plan @superpower fix the errors found in the previous test`

`@superpower fix the errors found in the previous test`

## `question test`

If `question` and `test` appear together, `question` remains the hard read-only override.

Testing/inspection may still occur when needed to answer accurately.

No repository changes are allowed.

Example:

`question test 'Google login'`

→ inspect/test
→ explain results
→ no edits

---

# 6. `plan @superpower`

Meaning:

\> Use Superpowers for planning and the eventual implementation workflow.

Superpowers becomes the process authority.

Follow the installed Superpowers instructions exactly.

Expected flow:

`Request`

→ `Superpowers skill selection`

→ `project inspection`

→ `brainstorm/design when required`

→ `spec when required`

→ `implementation plan`

→ `required user approval`

→ `implementation`

→ `tests`

→ `review`

→ `verification`

Use the appropriate Superpowers skills, such as:

- brainstorming

- writing-plans

- test-driven-development

- systematic-debugging

- subagent-driven-development

- executing-plans

- requesting-code-review

- verification-before-completion

- finishing-a-development-branch

Do not bypass Superpowers approval gates.

If Superpowers requires approval before implementation, STOP and wait for approval.

Example:

`plan @superpower add Google authentication`

→ Superpowers workflow  

→ design/spec if necessary  

→ implementation plan  

→ approval  

→ implementation  

→ verification

---

# 7. `plan @impeccable`

Meaning:

\> Audit the relevant frontend UX/UI using Impeccable and provide an improvement plan.

Use Impeccable specifically for frontend/interface quality.

Workflow:

1. Inspect the current relevant frontend.

2. Run/use Impeccable.

3. Audit the UX/UI.

4. Provide the current Impeccable score when available.

5. Categorize findings:

   - P0

   - P1

   - P2

   - P3

6. Explain what is:

   - confusing

   - inaccessible

   - inconsistent

   - outdated

   - visually weak

   - unnecessarily complex

   - slow

7. Propose improvements.

8. Identify affected screens/components.

9. Explain intended UX/visual direction.

10. STOP before implementation unless the user explicitly authorizes implementation.

Focus on:

- usability

- discoverability

- hierarchy

- typography

- spacing

- color

- responsive behavior

- accessibility

- loading states

- empty states

- error states

- success states

- navigation

- forms

- dialogs

- interaction feedback

- frontend performance

- implementation integrity

Do not redesign unrelated parts of the product.

Example:

`plan @impeccable improve template editor`

→ audit editor  

→ score it  

→ P0-P3 findings  

→ improvement plan  

→ no implementation yet

---

# 8. `plan @superpower @impeccable`

Meaning:

\> Use Superpowers as the overall engineering process and Impeccable as the UX/UI specialist.

This is the strongest frontend workflow.

Do NOT treat these as two unrelated plans.

Produce one integrated workflow.

## Phase 1 — Superpowers project understanding

Use Superpowers to:

- inspect the project

- classify the task

- understand requirements

- identify constraints

- understand architecture

- follow required brainstorming/design process

## Phase 2 — Impeccable audit

Use Impeccable to:

- audit relevant current UI

- provide score when available

- identify P0/P1/P2/P3 issues

- evaluate:

  - usability

  - hierarchy

  - accessibility

  - responsiveness

  - consistency

  - interaction quality

  - performance

  - implementation quality

## Phase 3 — Consolidated design

Combine:

- Superpowers architectural findings

- Impeccable UX/UI findings

into one coherent design.

Explain:

- what should change

- why

- UX impact

- technical impact

- affected components

- risks

- tests

## Phase 4 — Implementation plan

Use Superpowers `writing-plans` when applicable.

Include:

- exact files

- task ordering

- interfaces

- TDD steps

- testing

- verification

- review checkpoints

## Phase 5 — Approval

Respect all Superpowers approval gates.

Do not implement before required approval.

## Phase 6 — Implementation

After approval:

- execute using the appropriate Superpowers workflow

- implement task-by-task

- use Impeccable guidance for frontend decisions

- preserve accessibility

- preserve security

- verify each meaningful batch

## Phase 7 — Polish and re-audit

After implementation:

1. run tests

2. run typecheck

3. run lint

4. run production build

5. use Impeccable polish where useful

6. rerun Impeccable audit

7. compare before/after

8. report remaining issues honestly

Expected flow:

`Superpowers`

→ `understand`

→ `Impeccable audit`

→ `score/findings`

→ `combined design`

→ `Superpowers plan`

→ `approval`

→ `implementation`

→ `Impeccable polish`

→ `verification`

→ `final audit`

---

# 9. `@superpower` Without `plan`

If `@superpower` appears without `plan`, use Superpowers for the requested task.

Example:

`@superpower fix template editor crash`

→ use systematic debugging if appropriate  

→ follow TDD/process requirements  

→ implement when Superpowers permits it  

→ verify

Superpowers remains the process authority.

---

# 10. `@impeccable` Without `plan`

If `@impeccable` appears without `plan`, use Impeccable for the frontend task.

If request says:

- audit

- critique

- inspect

- score

- review

then analyze only unless implementation is explicitly requested.

If request says:

- improve

- update

- polish

- fix

- modernize

- redesign

then Impeccable may guide implementation.

Preserve functionality and verify afterward.

---

# 11. `@superpower @impeccable` Without `plan`

Use both.

Superpowers controls:

- engineering process

- planning discipline

- approvals

- TDD

- reviews

- verification

Impeccable controls:

- UX/UI audit

- visual quality

- accessibility guidance

- responsiveness

- polish

- frontend re-audit

Example:

`@superpower @impeccable improve editor UX`

→ Superpowers workflow  

→ Impeccable audit/design guidance  

→ approval where required  

→ implementation  

→ polish  

→ re-audit  

→ verification

---

# 12. Token Budget Keywords

Available token modes:

`@tokenlow`

`@tokenmid`

`@tokenhigh`

`@tokenxhigh`

`@tokenultra`

`@tokenmax`

These do NOT represent exact token counts.

They control relative:

- repository context depth

- plan detail

- subagent usage

- review depth

- testing breadth

- verification breadth

Security and correctness requirements still apply at every level.

---

# 13. Default Token Mode

If a request contains `plan`, or uses `test @superpower`, and no token mode is specified:

Use:

`@tokenmid`

automatically.

Do not ask the user which token mode they want.

Examples:

`plan add Google login`

means:

`plan @tokenmid add Google login`

`plan @superpower add Google login`

means:

`plan @superpower @tokenmid add Google login`

`plan @impeccable improve dashboard`

means:

`plan @impeccable @tokenmid improve dashboard`

`plan @superpower @impeccable improve editor`

means:

`plan @superpower @impeccable @tokenmid improve editor`

`test @superpower 'Google login'`

means:

`test @superpower @tokenmid 'Google login'`

---

# 14. `@tokenlow`

Purpose:

\> Aggressively conserve token usage.

Use for small/straightforward tasks.

Behavior:

- inspect only directly relevant files

- avoid broad repository scans

- concise plans

- prefer inline execution

- 0–1 subagent maximum by default

- avoid duplicate reviewers

- avoid repeated context rereads

- use targeted tests where safe

- changed-files-only review where safe

- still run critical security/type/build checks

Superpowers:

- use the lightest workflow allowed

- avoid subagent-driven execution unless clearly necessary

Impeccable:

- audit only the requested screen/component

Relative usage:

`VERY LOW`

---

# 15. `@tokenmid`

Purpose:

\> Balanced quality and token usage.

This is the DEFAULT.

Behavior:

- inspect relevant subsystem

- avoid unnecessary repository-wide scans

- concise but complete planning

- prefer inline execution for tightly related tasks

- up to 2 subagents by default

- one meaningful review pass

- targeted integration tests

- normal typecheck/lint/build

Superpowers:

- follow required workflow

- avoid excessive decomposition

- use up to 2 subagents only when useful

Impeccable:

- audit affected flow and nearby components

- rerun audit after implementation when appropriate

Relative usage:

`MODERATE`

---

# 16. `@tokenhigh`

Purpose:

\> Stronger implementation confidence.

Use for:

- larger features

- auth

- database work

- complicated workflows

- meaningful refactors

- integration-heavy changes

Behavior:

- broader subsystem inspection

- detailed plan

- up to 3 subagents

- dedicated review pass

- stronger integration testing

- inspect related callers/consumers

- broader regression checks

Relative usage:

`HIGH`

---

# 17. `@tokenxhigh`

Purpose:

\> Very thorough execution.

Behavior:

- inspect full affected architecture

- detailed design reasoning

- up to 5 subagents

- reviews after major batches

- broader tests

- deeper edge-case analysis

- accessibility/security/performance review where applicable

Superpowers:

- subagent-driven development may be preferred when tasks are genuinely independent

Impeccable:

- broader feature-flow audit

- post-implementation re-audit

Relative usage:

`VERY HIGH`

---

# 18. `@tokenultra`

Purpose:

\> Extremely thorough workflow without deliberate waste.

Use for:

- architectural changes

- major security changes

- large refactors

- release-critical features

- multiple interacting subsystems

Behavior:

- broad repository/context inspection

- detailed specification

- up to 7 subagents

- specialized reviews where valuable

- security review where relevant

- performance review where relevant

- accessibility review where relevant

- broad regression testing

- final whole-change review

Impeccable:

- broad product-area audit

- implementation

- polish

- re-audit

Relative usage:

`EXTREMELY HIGH`

Warn when a lower token mode would likely provide nearly the same result.

---

# 19. `@tokenmax`

Purpose:

\> Maximum reasonable rigor.

Only use when explicitly requested.

Behavior:

- inspect all materially relevant context

- use full appropriate Superpowers workflow

- no fixed subagent cap

- use only genuinely useful agents

- multiple review cycles when justified

- broad integration/regression testing

- architecture/spec compliance review

- security/performance/accessibility reviews where relevant

- full Impeccable audit + polish + re-audit for frontend tasks

- final exhaustive verification

Do not waste tokens intentionally.

YAGNI still applies.

Relative usage:

`MAXIMUM`

Warn before very large execution.

---

# 20. Token Mode Hierarchy

Lowest to highest:

`@tokenlow`

→ `@tokenmid`

→ `@tokenhigh`

→ `@tokenxhigh`

→ `@tokenultra`

→ `@tokenmax`

If multiple token modes appear, use the HIGHEST one.

Example:

`plan @tokenlow @tokenhigh add auth`

→ use `@tokenhigh`

Mention which mode was selected.

---

# 21. Default Subagent Limits

These are ceilings, NOT targets.

| Token Mode | Default Maximum Subagents |

|---|---:|

| `@tokenlow` | 0–1 |

| `@tokenmid` | 2 |

| `@tokenhigh` | 3 |

| `@tokenxhigh` | 5 |

| `@tokenultra` | 7 |

| `@tokenmax` | No fixed cap |

Do not dispatch agents merely because the budget allows them.

If one agent can safely complete the work, prefer one agent.

Prefer inline execution for tightly coupled work.

Use multiple subagents primarily for genuinely independent tasks.

---

# 22. Token Usage Estimates

Every `plan` response must include an estimated-usage section. Every `test @superpower` response must also include an estimated-usage section.

## Estimated Usage

Report:

- Token mode

- Planning cost

- Planning + implementation cost

- Estimated 5-hour impact

- Estimated 7-day impact

- Confidence: LOW / MEDIUM / HIGH

- Main cost drivers

- Lower-token alternative when useful

Use approximate ranges.

Never pretend to know actual remaining account quota unless that information is explicitly available.

Good:

`~10–20%`

Bad:

`13.47%`

Example:

## Estimated Usage

Token mode: `@tokenmid (default)`

Planning:

5-hour impact: ~3–7%  

7-day impact: ~1–2%

Planning + implementation:

5-hour impact: ~10–20%  

7-day impact: ~2–5%

Confidence: LOW

Main cost drivers:

- repository inspection

- implementation

- tests

- one review pass

These are planning estimates only.

---

# 23. Token Budget Warning Rules

If estimated planning + implementation consumption is:

## Greater than ~30% of 5-hour window

Show a brief warning.

## Greater than ~50%

Also provide a lower-token alternative.

## Greater than ~70%

Strongly recommend:

- splitting into smaller batches

- using multiple sessions

- lowering token mode

Do not automatically downgrade the user's requested mode.

Example:

`This looks expensive under @tokenultra. @tokenhigh would likely provide most of the quality with substantially lower usage.`

---

# 24. Superpowers Token Behavior

Examples:

`plan @superpower @tokenlow add settings toggle`

→ Superpowers  

→ minimal context  

→ likely inline execution  

→ ≤1 subagent

`plan @superpower @tokenmid add feature`

→ normal balanced Superpowers workflow  

→ ≤2 useful subagents

`plan @superpower @tokenhigh add Google OAuth`

→ more detailed planning/review  

→ ≤3 subagents

`plan @superpower @tokenxhigh refactor editor`

→ strong review workflow  

→ ≤5 subagents

`plan @superpower @tokenultra redesign architecture`

→ broad planning/reviews  

→ ≤7 subagents

`plan @superpower @tokenmax rebuild auth architecture`

→ maximum appropriate rigor  

→ warn about high usage

Token mode controls resource intensity.

Superpowers controls process and approval gates.

---

# 25. Impeccable Token Behavior

Examples:

`plan @impeccable @tokenlow improve dialog`

→ audit dialog only

`plan @impeccable @tokenmid improve settings flow`

→ audit affected flow + nearby components

`plan @impeccable @tokenhigh improve editor`

→ full editor-flow audit

`plan @superpower @impeccable @tokenxhigh modernize dashboard`

→ combined broad audit/design/implementation/re-audit

Do not audit the entire application when the task only concerns one small component unless evidence shows the broader context is necessary.

---

# 26. Question + Token Modes

`question` remains read-only regardless of token mode.

Examples:

`question @tokenlow can this run on Vercel?`

→ concise read-only answer

`question @tokenmax analyze this architecture`

→ deep read-only analysis  

→ no implementation

`question plan @tokenhigh improve auth`

→ detailed plan  

→ no edits

---

# 27. Mid-Project Use

These instructions may be added during an existing Codex project/session.

When applied mid-project:

1. Treat these instructions as active from this point forward.

2. Do not restart completed work.

3. Do not discard existing approved plans/specs.

4. Inspect current working tree before new implementation.

5. Respect existing changes.

6. Apply this keyword router to future prompts.

7. If an approved Superpowers plan already exists, continue from it unless the new task changes scope.

8. Do not recreate a plan merely because this context was newly added.

---

# 28. Repository and Permission Policy

These rules apply to Codex, Superpowers, subagents, and any other agent working under this context.

## Git Branches and Commits

Work only on the currently checked-out branch.

Do NOT:

- create a new Git branch
- switch to another branch for the task
- create Git worktrees
- invoke a workflow that creates or requires a separate branch/worktree
- commit changes
- amend commits
- create merge commits
- push commits or branches
- open or merge pull requests unless the user explicitly overrides this policy

Leave all implementation changes uncommitted in the current working tree so the user can inspect them.

If a Superpowers skill normally recommends or requires a branch, worktree, commit, or branch-finishing workflow, this project policy overrides that behavior. Continue safely in the current working tree when possible. If the skill cannot be followed without violating this rule, stop and explain the conflict instead of creating a branch or commit.

Do not discard, reset, overwrite, or revert pre-existing user changes.

## Project-Scoped Permission Approval

The user pre-approves permissions needed to perform authorized work inside this project/repository.

For actions that are within the requested task and confined to the project, proceed without repeatedly asking for permission to:

- read project files
- create, edit, move, or delete project files when required by the approved task
- run project scripts and development commands
- run tests, typechecks, linters, formatters, and builds
- run package-manager commands required by the approved implementation
- install or update project dependencies when the approved task genuinely requires them
- generate build artifacts, caches, test output, and other normal project-local files
- inspect Git status and diffs

This pre-approval does NOT override explicit planning/implementation approval gates. For example, if `plan @superpower` requires design approval before implementation, still wait for that approval. Once implementation is approved, normal project-scoped tool/file permissions are considered approved.

This pre-approval is limited to the project. It does NOT authorize:

- accessing or modifying unrelated files outside the project
- reading or exposing secrets unnecessarily
- destructive system-level operations
- changing operating-system security settings
- modifying unrelated repositories
- external account, cloud, billing, production, deployment, or infrastructure changes unless explicitly requested
- bypassing security controls or sandbox restrictions

When an environment or tool itself requires a mandatory confirmation that cannot be bypassed by project instructions, follow the platform requirement. Do not claim that the permission was bypassed.

---

# 29. Implementation Safety

Do not:

- rewrite unrelated code

- redesign unrelated UI

- introduce unnecessary dependencies

- silently change API contracts

- weaken authentication

- weaken authorization

- weaken sandbox/security boundaries

- expose secrets

- skip tests just to finish faster

- delete functionality merely to simplify implementation

If a UI improvement requires backend changes:

- explain the dependency

- do not silently implement backend changes unless authorized

---

# 30. Secrets

Never:

- print secrets

- quote `.env` secrets

- commit credentials

- copy authentication tokens into output

- expose private keys

- include Authorization headers in logs

- include credentials in audit output

If a secret is discovered accidentally:

- do not repeat it

- report that a credential appears exposed

- recommend rotation/revocation

- do not use it unless explicitly required and safe

---

# 31. Default Verification

For implementation work, use the repository's actual tooling.

Where available run:

- relevant unit tests

- integration tests

- typecheck

- lint

- production build

- UI/browser tests where appropriate

- `git diff --check`

Do not blindly run expensive full suites when `@tokenlow` and targeted checks are sufficient, unless safety requires full verification.

Higher token modes may use broader testing.

---

# 32. Superpowers Verification

When using Superpowers:

Follow Superpowers verification/review requirements.

Do not claim:

- fixed

- complete

- working

- passing

until verification has actually run and passed.

Use the appropriate review/verification skills where required.

---

# 33. Impeccable Verification

For Impeccable implementation work:

After changes, when appropriate:

1. run tests

2. run typecheck

3. run lint

4. run production build

5. polish affected UI

6. rerun Impeccable audit

7. report before/after score

8. report unresolved findings

Do not chase a perfect numerical score at the expense of product quality.

---

# 34. Skill Combination Authority

When both skills are used:

## Superpowers owns:

- development process

- task classification

- brainstorming

- specification

- implementation planning

- TDD

- agent coordination

- review

- verification

## Impeccable owns:

- UX/UI analysis

- interface quality

- accessibility guidance

- visual hierarchy

- interaction polish

- responsive UX

- frontend design quality

- frontend re-audit

If their recommendations conflict:

- preserve security

- preserve functional requirements

- preserve approved architecture

- use Superpowers process to resolve the conflict

- do not sacrifice accessibility or security merely for visual polish

---

# 35. Approval Rules

If the active Superpowers workflow requires user approval:

STOP before implementation.

Do not interpret:

`plan @superpower`

as permission to bypass the approval gate.

If the user explicitly approves the generated plan/design:

continue according to the Superpowers execution workflow.

For ordinary `plan` without `@superpower`:

planning only; never implement.

---

# 36. Execution Preference

Default execution preference:

- inline for tightly coupled work

- subagents for clearly independent work

Do not use 10 subagents for a task that can be handled safely by 1–2.

Token budget mode determines the maximum allowed by default.

Quality benefit must justify subagent cost.

---

# 37. Plan Output Requirements

Every plan should clearly identify:

## Goal

What is being built/fixed.

## Current State

What the existing code currently does.

## Scope

What will and will not change.

## Files / Components

Likely affected areas.

## Steps

Ordered implementation sequence.

## Tests

What needs to be verified.

## Risks / Edge Cases

Potential failure modes.

## Verification

Commands/checks to prove completion.

## Estimated Usage

Token mode and approximate 5-hour/7-day impact.

For Superpowers plans, use the structure required by the actual Superpowers skill instead when it is stricter.

---

# 38. Keyword Precedence

Use the most specific matching workflow.

`question` is always the strongest read-only override.

Suggested order:

1. `question test @superpower @impeccable`
2. `question test @superpower`
3. `question test @impeccable`
4. `question test`
5. `question plan @superpower @impeccable`
6. `question plan @superpower`
7. `question plan @impeccable`
8. `question plan`
9. `question @superpower @impeccable`
10. `question @superpower`
11. `question @impeccable`
12. `question`
13. `test @superpower @impeccable`
14. `test @superpower`
15. `test @impeccable`
16. `test`
17. `plan @superpower @impeccable`
18. `plan @superpower`
19. `plan @impeccable`
20. `plan`
21. `@superpower @impeccable`
22. `@superpower`
23. `@impeccable`

Token modes modify whichever workflow was selected.

They do not replace it.

If multiple token modes appear, use the highest mode according to the defined hierarchy.

---

# 39. Quick Reference

## Read-only Question

`question something`

→ answer only  
→ no changes

`question plan something`

→ answer + plan  
→ no edits

`question test something`

→ test/inspect as needed + explain  
→ no edits

---

## Normal Plan

`plan something`

→ normal plan  
→ `@tokenmid` automatically  
→ no implementation

---

## Normal Test

`test 'feature'`

→ inspect + test + diagnose  
→ return errors/warnings/results  
→ no changes

---

## Superpowers Test

`test @superpower 'feature'`

→ Superpowers debugging/testing  
→ default `@tokenmid`  
→ estimated 5-hour/7-day percentage usage  
→ report errors/root causes  
→ no fixes by default

---

## Impeccable Test

`test @impeccable 'feature'`

→ UX/UI audit  
→ score/findings where available  
→ no changes

---

## Combined Test

`test @superpower @impeccable @tokenhigh 'feature'`

→ technical diagnosis  
→ UX/UI audit  
→ token estimate  
→ combined findings  
→ no implementation

---

## Superpowers Plan

`plan @superpower something`

→ Superpowers planning  
→ default `@tokenmid`  
→ approval  
→ implementation when workflow allows

---

## Impeccable Plan

`plan @impeccable something`

→ UX/UI audit  
→ score  
→ findings  
→ improvement plan  
→ no implementation until authorized

---

## Combined Plan

`plan @superpower @impeccable something`

→ Superpowers process  
→ Impeccable audit  
→ combined design  
→ plan  
→ approval  
→ implementation  
→ polish  
→ final audit

---

## Token Modes

`@tokenlow`
→ cheapest useful workflow

`@tokenmid`
→ balanced DEFAULT

`@tokenhigh`
→ thorough

`@tokenxhigh`
→ very thorough

`@tokenultra`
→ extremely thorough

`@tokenmax`
→ maximum reasonable rigor

---

# 40. Examples

### Simple question

`question what database does this project use?`

→ answer only

### Deep question

`question @tokenhigh explain the authentication architecture`

→ deeper read-only analysis

### Normal plan

`plan add logout`

→ `@tokenmid`  

→ implementation plan only

### Cheap Superpowers task

`plan @superpower @tokenlow add settings toggle`

→ Superpowers  

→ minimal context/subagents  

→ approval  

→ implementation

### Normal Superpowers feature

`plan @superpower add Google authentication`

→ implied `@tokenmid`

### UX audit

`plan @impeccable improve settings page`

→ implied `@tokenmid`  

→ audit + score + plan

### Thorough UX work

`plan @impeccable @tokenhigh improve editor UX`

→ broad editor audit + detailed plan

### Combined frontend workflow

`plan @superpower @impeccable @tokenhigh modernize dashboard`

→ Superpowers process  

→ Impeccable audit  

→ combined design  

→ implementation plan  

→ approval  

→ implementation  

→ polish  

→ re-audit

### Normal diagnostic test

`test 'Google login'`

→ inspect current implementation  
→ run targeted checks  
→ report errors and warnings  
→ no edits

### Superpowers diagnostic test

`test @superpower 'authentication flow'`

→ implied `@tokenmid`  
→ systematic debugging/testing  
→ percentage token estimate  
→ report root cause  
→ no fixes by default

### Combined technical + UX test

`test @superpower @impeccable @tokenhigh 'template editor'`

→ technical diagnosis  
→ Impeccable audit  
→ combined findings  
→ usage estimate  
→ no implementation

### Maximum rigor

`plan @superpower @tokenmax refactor authentication`

→ full appropriate workflow  

→ maximum reasonable review  

→ token warning required

---

# 41. Final Principles

Optimize for:

1. correctness

2. security

3. user intent

4. maintainability

5. verification

6. efficient token use

Do not confuse more agents or more tokens with better engineering.

Use only the depth necessary for the requested token mode and task risk.

Default behavior should be:

`question = answer only`

`plan = plan only`

`test = diagnose only`

then:

`clear`

→ `focused`

→ `@tokenmid`

→ `verified`

→ `no unnecessary work`