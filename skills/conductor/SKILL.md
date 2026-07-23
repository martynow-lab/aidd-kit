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
- After each stage: one short status line — stage, artifact path, **short commit SHA**, next action.
- **Commit after every subagent (and every conductor-authored step)** — see **Commits** below. Aligns with WORKFLOW **Stage commit discipline**. Do **not** wait for the user to ask.
- Max **3** REVISE/REFACTOR rounds per loop; then stop and ask the user.
- Never freeze on REVISE or REFACTOR.
- Never start Stage 9 (PR) or Stage 10 (retro).
- **Never** combine Stage 5 RED and Stage 6 GREEN in one Task.
- **No post-AC code:** after revizor PASS / while the AC gate is pending / after AC unlock, do **not** edit production code or tests unless the user explicitly asks. Stage 8 is docs-only (`CHANGELOG.md` + `PR-DRAFT.md`).

## Commits (conductor default)

While `/conductor` is running, **commit on `spec/<feature-slug>` immediately after every subagent (or conductor-authored step) finishes — before launching the next Task**. Include draft, **REVISE**, re-review, freeze, RED, GREEN, REFACTOR, and Stage 8. Do not batch several subagent outputs into one commit. Do not ask again for permission mid-run (overrides the usual “only commit when asked” habit **for conductor deliverables only**).

**Loop:** `subagent done → commit → status line (with SHA) → next step`.

### When to commit (every handoff)

| After | Typical message / paths | Notes |
|-------|-------------------------|-------|
| Stage 3 specify (draft) | `docs(<f>): draft SPEC` → `SPEC.md` | After `spec:validate` clean |
| Stage 3.5 review | `docs(<f>): SPEC-REVIEW REVISE (round N)` or `… APPROVE` → `SPEC-REVIEW.md` | Commit **even on REVISE** before sending Fix list back |
| Specify revise | `docs(<f>): revise SPEC for …` → `SPEC.md` | Each REVISE round = its own commit |
| Auto-freeze SPEC | `docs(<f>): freeze SPEC` → Status `frozen` | Separate from the APPROVE review commit when both happened |
| Stage 4 test-plan (draft) | `docs(<f>): draft TEST-PLAN` → `TEST-PLAN.md` | |
| Stage 4.5 review | `docs(<f>): TEST-PLAN-REVIEW REVISE (round N)` or `… APPROVE` | Commit **even on REVISE** |
| Test-plan revise | `docs(<f>): revise TEST-PLAN for …` | Each round = own commit |
| Auto-freeze TEST-PLAN | `docs(<f>): freeze TEST-PLAN` | |
| Slice RED (evidence gate passed **or** boundary lock-in) | `test(<f>): RED <slice-id> …` | No production behaviour |
| Slice GREEN | `feat(<f>): GREEN <slice-id> …` | Separate from that slice’s RED; **skip** if lock-in |
| Stage 7 / REFACTOR loop | `docs(<f>): REVIZOR <PASS\|REFACTOR>`; GREEN fixups as `feat`/`refactor` | Commit after **each** revizor or GREEN fix Task |
| Stage 8 | `docs(<f>): changelog + PR-DRAFT` | Always |

With `--skip-reviews`, still commit draft SPEC / draft TEST-PLAN, then the freeze commits (no review/REVISE rows).

### Rules

- Follow the user’s git commit protocol (status/diff/log → stage → HEREDOC message → verify). Never `--no-verify` unless RED tests are blocked by husky **and** WORKFLOW Stage 5 allows it deliberately; never amend unless those rules allow; never push unless the user asks.
- **One commit per subagent/step** — if catch-up is needed mid-run, reconstruct the same granularity (draft → review → revise → …), do not squash the trail.
- Do **not** commit secrets, unrelated dirty files, or conductor skill / `WORKFLOW` edits on the feature branch (skill/`WORKFLOW` → separate branch per **Branch scope**).
- Skip empty commits if a step produced no file changes.
- Status line may note the commit short hash, e.g. `Stage 3.5 REVISE — abc1234 → specify Fix list`.

### Stage map

| Stage | Who | Deliverable |
|-------|-----|-------------|
| 3 | `.cursor/agents/specify.md` | `SPEC.md` (draft) → commit |
| 3.5 | `.cursor/agents/spec-reviewer.md` | `SPEC-REVIEW.md` — default; skip if `--skip-reviews` → commit |
| freeze SPEC | **conductor** | set Status → `frozen` → commit |
| 4 | `.cursor/agents/test-plan.md` | `TEST-PLAN.md` (draft) → commit |
| 4.5 | `.cursor/agents/test-plan-reviewer.md` | `TEST-PLAN-REVIEW.md` — default; skip if `--skip-reviews` → commit |
| freeze TEST-PLAN | **conductor** | set Status → `frozen` (YAML `status:` + table) → commit |
| 5 RED | Separate Task + `.cursor/rules/anti-over-engineering.md` | failing P0 tests / checklist only → **commit** |
| 6 GREEN | Separate Task + anti-oe + tech-stack rule | minimal code → **commit** (skip if RED was boundary lock-in) |
| 7 | `.cursor/agents/revizor.md` | `REVIZOR-REVIEW.md` → **commit** |
| AC gate | **user** | pause until user confirms every AC — **no code/test edits** |
| 8 | **conductor** (or short Task) | `CHANGELOG.md` entry + `PR-DRAFT.md` → **commit** |

## Default path (reviews on)

0. **Clarifying questions** — after preflight, ask and wait (see above). Only
   then emit the Conductor status line and start Stage 3.
1. **Stage 3** — run specify until SPEC draft is ready (linter clean: `npm run spec:validate -- <feature>`). Tell the agent conductor will freeze — leave Status `draft`. Include the user’s pre-session answers in the Task prompt. **Commit** draft SPEC.
2. **Stage 3.5** — run spec-reviewer. **Commit** review (REVISE or APPROVE). On `REVISE` → specify with Fix list → **commit** revise → re-review (max 3). On `APPROVE` → continue.
3. **Auto-freeze SPEC** — see below. **Commit** freeze.
4. **Stage 4** — run test-plan against frozen SPEC (leave draft; conductor freezes). **Commit** draft TEST-PLAN.
5. **Stage 4.5** — run test-plan-reviewer. **Commit** review. On `REVISE` → test-plan with Fix list → **commit** → re-review (max 3). On `APPROVE` → continue.
6. **Auto-freeze TEST-PLAN**. **Commit** freeze.
7. **Stages 5–6** — slice-by-slice with **separate** RED and GREEN Tasks; **commit after each** RED and each GREEN (skip GREEN when RED was boundary lock-in).
8. **Stage 7** — run revizor. **Commit** after each revizor result. On `REFACTOR`, re-run GREEN with Fix list (**commit**), then revizor again.
9. On `PASS` — **stop** and ask the user to confirm all Acceptance Criteria.
10. Only after AC unlock → **Stage 8** (see below); **commit** Stage 8. Then **stop** — Stage 9/10 are user-owned.

## Path with `--skip-reviews`

Same as default (including clarifying questions before Stage 3), but:

- Skip Stages 3.5 and 4.5.
- Auto-freeze SPEC after Stage 3 draft + successful `spec:validate --freeze`.
- Auto-freeze TEST-PLAN after Stage 4 draft.

## RED / GREEN (per slice)

When TEST-PLAN has `slices`, process them in order. For **each** slice:

1. **Stage 5 RED only** — one Task (`generalPurpose` + anti-OE). Write failing tests / checklist only. No production code for new behaviour.
2. **RED evidence gate (conductor)** — run the slice’s test file(s) with vitest (or read an explicit failure summary from the RED agent). Prefer **non-zero failures** for P0 behaviour slices. Status line:

   ```text
   RED <slice-id> — N failing → GREEN
   ```

   **Boundary / lock-in exception:** if the slice is only static lint / import-boundary regression guards (no new behaviour under test) and all tests **pass** (0 failing), treat as already-green lock-in:

   ```text
   RED <slice-id> — 0 failing (boundary lock-in) → skip GREEN
   ```

   Then **commit RED**, **skip GREEN**, continue to the next slice (or Stage 7). Note lock-in in the RED commit message. Do not ask the user unless it is unclear whether the slice is lock-in.

   If zero failures / no evidence **and** the slice is **not** documented lock-in → **hard stop**; do not start GREEN.
3. **Stage 6 GREEN only** — a **separate** Task (anti-OE + tech-stack). Minimal code until P0 `doneWhen` is green. **Skip** when the prior RED was an already-green boundary lock-in.

Do **not** launch “RED then GREEN” in a single Task.

After RED evidence gate passes (or lock-in skip) → **commit RED**. After GREEN is green → **commit GREEN**. Then proceed to the next slice (or Stage 7).

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
- Status line when done: `Stage 8 — CHANGELOG.md + PR-DRAFT.md ready (<sha>). Stage 9
  (PR) is yours.`
- **Commit** Stage 8 artifacts after writing them (`docs(<feature>): changelog + PR-DRAFT`) — do not wait for the user to ask.

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
- RED evidence gate fails (zero failures / no evidence) **and** the slice is not an already-green boundary lock-in
- Revizor returned `PASS` and AC gate is pending — **do not** start fixing
  sibling tests, production code, or tooling until the user unlocks Stage 8
  (or explicitly asks for a fix)
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