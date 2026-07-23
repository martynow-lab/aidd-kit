---
name: conductor
description: >
  Orchestrates AiDD Workflow Stages 3–8 for one feature in a single run
  (clarifying Qs → SPEC → review → TEST-PLAN → review → RED → GREEN →
  revizor → changelog) with conductor-only auto-freeze. Before Stage 3,
  asks clarifying questions from the roadmap/SPEC. Reviews (Stages 3.5 and
  4.5) run by default; pass --skip-reviews to omit them. Use only when the
  user invokes /conductor or explicitly asks for conductor mode.
disable-model-invocation: true
---

# Conductor mode (Stages 3–8)

You are the **conductor** — an orchestrator, not an author. Drive one feature
through Stages 3–8 using existing agents and artifacts. Do **not** write SPEC,
TEST-PLAN, tests, or production code in this chat.

**Exception — Stage 8:** after the AC gate, you (or a short Task) **do** write
`CHANGELOG.md` and `.cursor/workspace/active/<feature>/PR-DRAFT.md`. No other
authoring.

Default AiDD workflow (one stage — one chat; only the user freezes) is unchanged
outside this mode. Auto-freeze applies **only** while conducting.

## Invocation

```text
/conductor <feature-slug> [--skip-reviews]
```

- Ask for `<feature-slug>` if missing (kebab-case, match ROADMAP item).
- Reviews (Stages 3.5 and 4.5) are **on by default**.
- `--skip-reviews`: skip Stages 3.5 and 4.5; freeze after successful drafts only.

After preflight **and** the clarifying-questions gate, emit one status line
before Stage 3:

```text
Conductor: <feature-slug> — reviews: on|off — branch: spec/<feature-slug>
```

## Preflight

1. Confirm `.cursor/docs/ARCHITECTURE.md` exists.
2. Confirm roadmap: `.cursor/docs/ROADMAP.md` or `.cursor/docs/planning/`.
3. Confirm required agent files exist: `.cursor/agents/specify.md`,
   `spec-reviewer.md`, `test-plan.md`, `test-plan-reviewer.md`,
   `revizor.md`. Report any missing files by name and stop — do not start a
   stage whose agent file is absent.
4. Ensure `.cursor/workspace/active/<feature>/` exists (create if needed).
5. Ensure work happens on branch `spec/<feature-slug>` — see **Branching**
   below.
6. If already mid-cycle (frozen SPEC, etc.), resume at the first incomplete
   stage — do not redo finished stages. See **Resume / mid-run** below.

Stop and report if architecture, roadmap, or any required agent file is
missing.

## Clarifying questions (before Stage 3)

Before launching Stage 3 on a **fresh** conductor run (no frozen SPEC yet),
**stop and ask the user clarifying questions** derived from the indicated
feature — do not start specify until answers (or an explicit “proceed as
assumed”) are in.

1. Locate the roadmap item for `<feature-slug>` (ROADMAP / planning docs).
2. Read any existing draft SPEC at
   `.cursor/workspace/active/<feature>/SPEC.md` if present.
3. Also skim ARCHITECTURE deferred items and PRODUCT-VISION open questions
   that the roadmap item points at.
4. Ask **targeted** clarifying questions (short, decision-shaped — one answer
   per question). Cover only what would otherwise become open `Q-n` or wrong
   scope in SPEC, e.g.:
   - In-scope vs out-of-scope boundaries
   - UX / copy / surfaces when the feature is UI-facing
   - Policies deferred to SPEC (merge, delete, rename, etc.)
   - Acceptance bar or non-goals the roadmap leaves ambiguous
5. Pass the user’s answers into the Stage 3 Task prompt so specify locks them
   into FR/AC (and resolves related `Q-n`) instead of re-asking.

**Skip this gate when:**

- Resuming mid-run with SPEC already past draft-ready / frozen, or Stage ≥ 4
- The user already answered equivalent questions in this chat and says to
  proceed

**Do not** invent answers. If nothing is ambiguous, say so in one line and ask
once whether to proceed to Stage 3.

## Branching

All conductor work for a feature happens on a dedicated branch
`spec/<feature-slug>` (prefer this prefix over `feat/` / `feature/` for
conductor runs).

- Detect the **default base branch** via `git symbolic-ref refs/remotes/origin/HEAD`
  (or `gh repo view --json defaultBranchRef`) — typically `master` or `main`.
  Treat that tip (and `develop` if used as a protected integration branch) as
  protected.
- `git fetch` before creating a new `spec/<feature-slug>` so the branch tip is
  not stale.
- If the branch already exists (local or remote), check it out before Stage 3.
- If it does not exist, create it from the updated default base branch before
  starting Stage 3.
- **Never** run Stage 3–8 work directly on the default/`develop`/protected
  branch — hard stop and ask if conductor is invoked there.
- **Dirty tree:**
  - If already on `spec/<feature-slug>` and uncommitted changes are only this
    feature’s workspace / src / tests (resume after abort) — continue.
  - If a create/switch is required, or dirty files look unrelated (other
    features, skill/`WORKFLOW` edits, unrelated paths) — hard stop and ask
    before branching.
- Conductor does not merge, rebase, or push `spec/<feature-slug>` — that
  stays user-owned (Stage 9 territory).
- Do not land conductor skill / `WORKFLOW` edits on the feature branch being
  conducted — use a separate branch (same Stage 6 Practice / WORKFLOW
  Conductor **Branch scope**).

## Orchestration rules

- Launch each stage via **Task** / subagent with the matching agent file and `@` inputs from WORKFLOW handoffs.
- After each stage: one short status line — stage, artifact path, next action.
- Max **3** REVISE/REFACTOR rounds per loop; then stop and ask the user.
- Never freeze on REVISE or REFACTOR.
- Never start Stage 9 (PR) or Stage 10 (retro).
- **Never** combine Stage 5 RED and Stage 6 GREEN in one Task.

### Stage map

| Stage | Who | Deliverable |
|-------|-----|-------------|
| 3 | `.cursor/agents/specify.md` | `SPEC.md` (draft) |
| 3.5 | `.cursor/agents/spec-reviewer.md` | `SPEC-REVIEW.md` — default; skip if `--skip-reviews` |
| freeze SPEC | **conductor** | set Status → `frozen` |
| 4 | `.cursor/agents/test-plan.md` | `TEST-PLAN.md` (draft) |
| 4.5 | `.cursor/agents/test-plan-reviewer.md` | `TEST-PLAN-REVIEW.md` — default; skip if `--skip-reviews` |
| freeze TEST-PLAN | **conductor** | set Status → `frozen` (YAML `status:` + table) |
| 5 RED | Separate Task + `.cursor/rules/anti-over-engineering.md` | failing P0 tests / checklist only; commit if user allows |
| 6 GREEN | Separate Task + anti-oe + tech-stack rule | minimal code; commit if user allows |
| 7 | `.cursor/agents/revizor.md` | `REVIZOR-REVIEW.md` |
| AC gate | **user** | pause until user confirms every AC |
| 8 | **conductor** (or short Task) | `CHANGELOG.md` entry + `PR-DRAFT.md` |

## Default path (reviews on)

0. **Clarifying questions** — after preflight, ask and wait (see above). Only
   then emit the Conductor status line and start Stage 3.
1. **Stage 3** — run specify until SPEC draft is ready (linter clean: `npm run spec:validate -- <feature>`). Tell the agent conductor will freeze — leave Status `draft`. Include the user’s pre-session answers in the Task prompt.
2. **Stage 3.5** — run spec-reviewer. On `REVISE` → specify with Fix list → re-review (max 3). On `APPROVE` → continue.
3. **Auto-freeze SPEC** — see below.
4. **Stage 4** — run test-plan against frozen SPEC (leave draft; conductor freezes).
5. **Stage 4.5** — run test-plan-reviewer. On `REVISE` → test-plan with Fix list → re-review (max 3). On `APPROVE` → continue.
6. **Auto-freeze TEST-PLAN**.
7. **Stages 5–6** — slice-by-slice with **separate** RED and GREEN Tasks (see below).
8. **Stage 7** — run revizor. On `REFACTOR`, re-run GREEN with Fix list, then revizor again.
9. On `PASS` — **stop** and ask the user to confirm all Acceptance Criteria.
10. Only after AC unlock → **Stage 8** (see below). Then **stop** — Stage 9/10 are user-owned.

## Path with `--skip-reviews`

Same as default (including clarifying questions before Stage 3), but:

- Skip Stages 3.5 and 4.5.
- Auto-freeze SPEC after Stage 3 draft + successful `spec:validate --freeze`.
- Auto-freeze TEST-PLAN after Stage 4 draft.

## RED / GREEN (per slice)

When TEST-PLAN has `slices`, process them in order. For **each** slice:

1. **Stage 5 RED only** — one Task (`generalPurpose` + anti-OE). Write failing tests / checklist only. No production code for new behaviour.
2. **RED evidence gate (conductor)** — run the slice’s test file(s) with vitest (or read an explicit failure summary from the RED agent). Require **non-zero failures** (or a clear `N failing` count for P0 scenarios). Status line:

   ```text
   RED <slice-id> — N failing → GREEN
   ```

   If zero failures / no evidence → **hard stop**; do not start GREEN.
3. **Stage 6 GREEN only** — a **separate** Task (anti-OE + tech-stack). Minimal code until P0 `doneWhen` is green.

Do **not** launch “RED then GREEN” in a single Task.

## Stage 8 — Changelog + PR draft

**Unlock:** user confirms ACs (`AC confirmed`, `stage 8`, or equivalent) after
revizor `PASS`. Do not start Stage 8 while the AC gate is pending.

**Inputs:** frozen `SPEC.md`, `REVIZOR-REVIEW.md`, feature diff / git log,
sibling archived `PR-DRAFT.md` + `CHANGELOG.md` entries for tone, test counts
(`npx vitest run` on feature files + full suite when practical).

**Deliverables (both required):**

1. **`CHANGELOG.md`** — Keep a Changelog entry under `[Unreleased]`:

   ```markdown
   ## [<feature>] — YYYY-MM-DD

   <one-line user-facing summary>

   ### Added
   - ...

   ### Fixed
   - ...

   ### Known limitations
   - ...
   ```

2. **`.cursor/workspace/active/<feature>/PR-DRAFT.md`** — Stage 9 body draft.
   Mirror archived siblings (e.g. `recipe-list-empty-nav/PR-DRAFT.md`): Summary,
   Changes table, Testing commands + counts, SPEC link, Limitations, Breaking
   changes. Lead with `> Stage 8 output. Copy into gh pr create --body at Stage 9.`

**Rules:**

- No production code or test edits in Stage 8.
- Known limitations / out of scope from SPEC §5; note breaking changes or
  `None`.
- Status line when done: `Stage 8 — CHANGELOG.md + PR-DRAFT.md ready. Stage 9
  (PR) is yours.`
- Commit Stage 8 artifacts only if the user asks.

## Auto-freeze (conductor only)

After Stage 3 success (and APPROVE when reviews on):

1. Run `npm run spec:validate -- <feature> --freeze`. If it fails (open `Q-n`, errors), **stop** — do not freeze; report blockers.
2. Set SPEC metadata Status from `draft` to `frozen` in `.cursor/workspace/active/<feature>/SPEC.md`.

After Stage 4 success (and APPROVE when reviews on):

1. Set TEST-PLAN YAML frontmatter `status: frozen` and the Status table cell to `frozen`.

Do not ask the user to type “spec frozen” / “test plan frozen” in conductor mode.

## Resume / mid-run

- Confirm the current branch is `spec/<feature-slug>` before resuming; if
  it is not, hard stop and ask the user to switch (do not switch branches
  silently mid-run).
- Resume at the first incomplete stage; do not redo finished stages.
- Skip the clarifying-questions gate when SPEC is already draft-ready /
  frozen or the first incomplete stage is ≥ 4.
- Do **not** rework already-green Stage 5–6 slices unless the user explicitly asks.
- Stage 8 incomplete when `PR-DRAFT.md` is missing or `CHANGELOG.md` has no
  `## [<feature>]` entry — run Stage 8 only after AC unlock.

### Flag change mid-cycle

If the user turns reviews **on** after an early freeze that skipped 3.5/4.5:

1. Set SPEC Status back to `draft` (and TEST-PLAN to `draft` if it exists / was frozen).
2. Run the missing review loop(s); freeze again only after APPROVE (and `spec:validate --freeze` for SPEC).

If the user turns reviews **off** (`--skip-reviews`) mid-cycle:

- Do **not** delete existing `SPEC-REVIEW.md` / `TEST-PLAN-REVIEW.md`.
- Simply skip any further review stages; continue with the remaining path.

## Hard stops

Stop and wait for the user when:

- Preflight fails (missing architecture/roadmap/agent files)
- Clarifying-questions gate is pending (fresh run before Stage 3)
- On default/`develop`/protected branch and cannot create or switch to
  `spec/<feature-slug>`
- Dirty tree blocks a required create/switch, or dirty files are unrelated to
  this feature
- `spec:validate --freeze` fails
- Review or revizor loop hits 3 rounds without APPROVE/PASS
- RED evidence gate fails (zero failures / no evidence)
- Revizor returned `PASS` and AC gate is pending
- Stage 8 complete — wait for user to run Stage 9 (PR)
- User cancels or changes scope

## Examples

```text
/conductor recipe-crud-view
```

Checks out/creates `spec/recipe-crud-view`; asks clarifying questions from
the roadmap item (and draft SPEC if any) before Stage 3; reviews on
(3.5 / 4.5); freeze only after APPROVE; separate RED then GREEN per slice;
pause after revizor PASS for AC; after AC unlock write CHANGELOG +
`PR-DRAFT.md`, then stop.

```text
/conductor recipe-crud-view --skip-reviews
```

Skip 3.5/4.5; auto-freeze after successful drafts; same branch, RED/GREEN, AC
gate, and Stage 8 rules.5. Pass the user’s answers into the Stage 3 Task prompt so specify locks them
   into FR/AC (and resolves related `Q-n`) instead of re-asking.

**Skip this gate when:**

- Resuming mid-run with SPEC already past draft-ready / frozen, or Stage ≥ 4
- The user already answered equivalent questions in this chat and says to
  proceed

**Do not** invent answers. If nothing is ambiguous, say so in one line and ask
once whether to proceed to Stage 3.

## Branching

All conductor work for a feature happens on a dedicated branch
`spec/<feature-slug>` (prefer this prefix over `feat/` / `feature/` for
conductor runs).

- Detect the **default base branch** via `git symbolic-ref refs/remotes/origin/HEAD`
  (or `gh repo view --json defaultBranchRef`) — typically `master` or `main`.
  Treat that tip (and `develop` if used as a protected integration branch) as
  protected.
- `git fetch` before creating a new `spec/<feature-slug>` so the branch tip is
  not stale.
- If the branch already exists (local or remote), check it out before Stage 3.
- If it does not exist, create it from the updated default base branch before
  starting Stage 3.
- **Never** run Stage 3–8 work directly on the default/`develop`/protected
  branch — hard stop and ask if conductor is invoked there.
- **Dirty tree:**
  - If already on `spec/<feature-slug>` and uncommitted changes are only this
    feature’s workspace / src / tests (resume after abort) — continue.
  - If a create/switch is required, or dirty files look unrelated (other
    features, skill/`WORKFLOW` edits, unrelated paths) — hard stop and ask
    before branching.
- Conductor does not merge, rebase, or push `spec/<feature-slug>` — that
  stays user-owned (Stage 9 territory).
- Do not land conductor skill / `WORKFLOW` edits on the feature branch being
  conducted — use a separate branch (same Stage 6 Practice / WORKFLOW
  Conductor **Branch scope**).

## Orchestration rules

- Launch each stage via **Task** / subagent with the matching agent file and `@` inputs from WORKFLOW handoffs.
- After each stage: one short status line — stage, artifact path, next action.
- Max **3** REVISE/REFACTOR rounds per loop; then stop and ask the user.
- Never freeze on REVISE or REFACTOR.
- Never start Stage 9 (PR) or Stage 10 (retro).
- **Never** combine Stage 5 RED and Stage 6 GREEN in one Task.

### Stage map

| Stage | Who | Deliverable |
|-------|-----|-------------|
| 3 | `.cursor/agents/specify.md` | `SPEC.md` (draft) |
| 3.5 | `.cursor/agents/spec-reviewer.md` | `SPEC-REVIEW.md` — default; skip if `--skip-reviews` |
| freeze SPEC | **conductor** | set Status → `frozen` |
| 4 | `.cursor/agents/test-plan.md` | `TEST-PLAN.md` (draft) |
| 4.5 | `.cursor/agents/test-plan-reviewer.md` | `TEST-PLAN-REVIEW.md` — default; skip if `--skip-reviews` |
| freeze TEST-PLAN | **conductor** | set Status → `frozen` (YAML `status:` + table) |
| 5 RED | Separate Task + `.cursor/rules/anti-over-engineering.md` | failing P0 tests / checklist only; commit if user allows |
| 6 GREEN | Separate Task + anti-oe + tech-stack rule | minimal code; commit if user allows |
| 7 | `.cursor/agents/revizor.md` | `REVIZOR-REVIEW.md` |
| AC gate | **user** | pause until user confirms every AC |
| 8 | **conductor** (or short Task) | `CHANGELOG.md` entry + `PR-DRAFT.md` |

## Default path (reviews on)

0. **Clarifying questions** — after preflight, ask and wait (see above). Only
   then emit the Conductor status line and start Stage 3.
1. **Stage 3** — run specify until SPEC draft is ready (linter clean: `npm run spec:validate -- <feature>`). Tell the agent conductor will freeze — leave Status `draft`. Include the user’s pre-session answers in the Task prompt.
2. **Stage 3.5** — run spec-reviewer. On `REVISE` → specify with Fix list → re-review (max 3). On `APPROVE` → continue.
3. **Auto-freeze SPEC** — see below.
4. **Stage 4** — run test-plan against frozen SPEC (leave draft; conductor freezes).
5. **Stage 4.5** — run test-plan-reviewer. On `REVISE` → test-plan with Fix list → re-review (max 3). On `APPROVE` → continue.
6. **Auto-freeze TEST-PLAN**.
7. **Stages 5–6** — slice-by-slice with **separate** RED and GREEN Tasks (see below).
8. **Stage 7** — run revizor. On `REFACTOR`, re-run GREEN with Fix list, then revizor again.
9. On `PASS` — **stop** and ask the user to confirm all Acceptance Criteria.
10. Only after AC unlock → **Stage 8** (see below). Then **stop** — Stage 9/10 are user-owned.

## Path with `--skip-reviews`

Same as default (including clarifying questions before Stage 3), but:

- Skip Stages 3.5 and 4.5.
- Auto-freeze SPEC after Stage 3 draft + successful `spec:validate --freeze`.
- Auto-freeze TEST-PLAN after Stage 4 draft.

## RED / GREEN (per slice)

When TEST-PLAN has `slices`, process them in order. For **each** slice:

1. **Stage 5 RED only** — one Task (`generalPurpose` + anti-OE). Write failing tests / checklist only. No production code for new behaviour.
2. **RED evidence gate (conductor)** — run the slice’s test file(s) with vitest (or read an explicit failure summary from the RED agent). Require **non-zero failures** (or a clear `N failing` count for P0 scenarios). Status line:

   ```text
   RED <slice-id> — N failing → GREEN
   ```

   If zero failures / no evidence → **hard stop**; do not start GREEN.
3. **Stage 6 GREEN only** — a **separate** Task (anti-OE + tech-stack). Minimal code until P0 `doneWhen` is green.

Do **not** launch “RED then GREEN” in a single Task.

## Stage 8 — Changelog + PR draft

**Unlock:** user confirms ACs (`AC confirmed`, `stage 8`, or equivalent) after
revizor `PASS`. Do not start Stage 8 while the AC gate is pending.

**Inputs:** frozen `SPEC.md`, `REVIZOR-REVIEW.md`, feature diff / git log,
sibling archived `PR-DRAFT.md` + `CHANGELOG.md` entries for tone, test counts
(`npx vitest run` on feature files + full suite when practical).

**Deliverables (both required):**

1. **`CHANGELOG.md`** — Keep a Changelog entry under `[Unreleased]`:

   ```markdown
   ## [<feature>] — YYYY-MM-DD

   <one-line user-facing summary>

   ### Added
   - ...

   ### Fixed
   - ...

   ### Known limitations
   - ...
   ```

2. **`.cursor/workspace/active/<feature>/PR-DRAFT.md`** — Stage 9 body draft.
   Mirror archived siblings (e.g. `recipe-list-empty-nav/PR-DRAFT.md`): Summary,
   Changes table, Testing commands + counts, SPEC link, Limitations, Breaking
   changes. Lead with `> Stage 8 output. Copy into gh pr create --body at Stage 9.`

**Rules:**

- No production code or test edits in Stage 8.
- Known limitations / out of scope from SPEC §5; note breaking changes or
  `None`.
- Status line when done: `Stage 8 — CHANGELOG.md + PR-DRAFT.md ready. Stage 9
  (PR) is yours.`
- Commit Stage 8 artifacts only if the user asks.

## Auto-freeze (conductor only)

After Stage 3 success (and APPROVE when reviews on):

1. Run `npm run spec:validate -- <feature> --freeze`. If it fails (open `Q-n`, errors), **stop** — do not freeze; report blockers.
2. Set SPEC metadata Status from `draft` to `frozen` in `.cursor/workspace/active/<feature>/SPEC.md`.

After Stage 4 success (and APPROVE when reviews on):

1. Set TEST-PLAN YAML frontmatter `status: frozen` and the Status table cell to `frozen`.

Do not ask the user to type “spec frozen” / “test plan frozen” in conductor mode.

## Resume / mid-run

- Confirm the current branch is `spec/<feature-slug>` before resuming; if
  it is not, hard stop and ask the user to switch (do not switch branches
  silently mid-run).
- Resume at the first incomplete stage; do not redo finished stages.
- Skip the clarifying-questions gate when SPEC is already draft-ready /
  frozen or the first incomplete stage is ≥ 4.
- Do **not** rework already-green Stage 5–6 slices unless the user explicitly asks.
- Stage 8 incomplete when `PR-DRAFT.md` is missing or `CHANGELOG.md` has no
  `## [<feature>]` entry — run Stage 8 only after AC unlock.

### Flag change mid-cycle

If the user turns reviews **on** after an early freeze that skipped 3.5/4.5:

1. Set SPEC Status back to `draft` (and TEST-PLAN to `draft` if it exists / was frozen).
2. Run the missing review loop(s); freeze again only after APPROVE (and `spec:validate --freeze` for SPEC).

If the user turns reviews **off** (`--skip-reviews`) mid-cycle:

- Do **not** delete existing `SPEC-REVIEW.md` / `TEST-PLAN-REVIEW.md`.
- Simply skip any further review stages; continue with the remaining path.

## Hard stops

Stop and wait for the user when:

- Preflight fails (missing architecture/roadmap/agent files)
- Clarifying-questions gate is pending (fresh run before Stage 3)
- On default/`develop`/protected branch and cannot create or switch to
  `spec/<feature-slug>`
- Dirty tree blocks a required create/switch, or dirty files are unrelated to
  this feature
- `spec:validate --freeze` fails
- Review or revizor loop hits 3 rounds without APPROVE/PASS
- RED evidence gate fails (zero failures / no evidence)
- Revizor returned `PASS` and AC gate is pending
- Stage 8 complete — wait for user to run Stage 9 (PR)
- User cancels or changes scope

## Examples

```text
/conductor recipe-crud-view
```

Checks out/creates `spec/recipe-crud-view`; asks clarifying questions from
the roadmap item (and draft SPEC if any) before Stage 3; reviews on
(3.5 / 4.5); freeze only after APPROVE; separate RED then GREEN per slice;
pause after revizor PASS for AC; after AC unlock write CHANGELOG +
`PR-DRAFT.md`, then stop.

```text
/conductor recipe-crud-view --skip-reviews
```

Skip 3.5/4.5; auto-freeze after successful drafts; same branch, RED/GREEN, AC
gate, and Stage 8 rules.
