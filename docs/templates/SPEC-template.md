# SPEC — <feature-name>

| | |
|---|---|
| **Feature** | `<feature-slug>` <!-- kebab-case, must match workspace/active/<feature>/ and the roadmap item --> |
| **Status** | `draft` <!-- draft → frozen. Only the user changes this to `frozen` --> |
| **Date** | YYYY-MM-DD |
| **Roadmap** | [ROADMAP.md](../../../docs/ROADMAP.md) <!-- link to the roadmap item or phase doc this spec implements; path is relative to workspace/active/<feature>/. Small project: ../../../docs/ROADMAP.md; large project: ../../../docs/planning/ROADMAP.md or ../../../docs/planning/phase-N.md --> |

---

## 1. Goal

<!-- One sentence: why this feature exists and what user/business problem it solves.
     No implementation details. If you need two sentences, the scope is probably too big. -->

...

## 2. Requirements

<!-- Functional requirements. Numbered with stable FR-n IDs — Stage 4 TEST-PLAN and
     Stage 7 review reference these IDs, so never renumber after freeze; append instead.
     Each FR describes observable behavior, not implementation. -->

- **FR-1** — ...
- **FR-2** — ...
- **FR-3** — ...

## 3. Acceptance Criteria

<!-- Verifiable "done" conditions with stable AC-n IDs. Each AC:
     - maps to at least one FR (note it in parentheses)
     - is testable: a concrete pass/fail observation, not a vague quality
     - uses Given / when / then (required by spec:validate ac-testable rule)
     Every FR must be covered by at least one AC.
     Error failure ACs: include full { field, code, message } from Error codes table.
     Multi-field failure ACs: pin errors[0] and errors[1] order (or "stable order" + fields).
     eslint.config.js GREEN deliverable: add an AC that inspects eslint.config.js, not only module lint. -->

- [ ] **AC-1** (FR-1) — Given ..., when ..., then ...
- [ ] **AC-2** (FR-1) — ...
- [ ] **AC-3** (FR-2) — ...

## 4. Edge Cases

<!-- Known boundary cases and how the feature must behave.
     At minimum consider: errors/failures, empty or missing data, permissions/auth,
     invalid input, concurrency or repeated actions. -->

| # | Scenario | Expected behavior |
|---|----------|-------------------|
| EC-1 | ... | ... (AC-n). |
| EC-2 | ... | ... (AC-n). |

## 5. Out of Scope

<!-- Explicit exclusions — tempting extras we deliberately skip in this feature.
     Anything listed here is a REFACTOR finding if it shows up in the diff. -->

- ...
- ...

## 6. Local Constraints

<!-- Project-specific constraints relevant to THIS feature, pulled from
     .cursor/docs/ARCHITECTURE.md: env, APIs, browser targets, WP capabilities,
     allowed/forbidden libraries, security requirements. Reference, don't duplicate. -->

- ...
- ...

## 7. Open Questions

<!-- TBD items. Before the spec can be frozen, every row must be `resolved`
     or explicitly `deferred` (with the owner noted). Default owner: the user. -->

| # | Question | Owner | Status |
|---|----------|-------|--------|
| Q-1 | ... | user | open <!-- open / deferred / resolved --> |
